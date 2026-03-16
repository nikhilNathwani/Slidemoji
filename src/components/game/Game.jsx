import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import { useAuth } from "../../hooks/useAuth";
import { usePuzzle } from "../../hooks/usePuzzle";
import { FontAwesomeIcon } from "../../utils/icons";
import {
	useSavePuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "../../hooks/useGameMutations";
import {
	convertGridFromFirestore,
	convertPuzzleFromFirestore,
} from "../../utils/puzzleUtils";
import { addPuzzleSolution } from "../../utils/statsHelpers";

function Game({
	puzzleId,
	gridSize,
	savedGame,
	maxGridSizeSolved = 0,
	hasNumbersShown,
	hasSoundEnabled,
}) {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Grid state - Game decides what to show
	const [initialGrid, setInitialGrid] = useState(null);
	const [currentGrid, setCurrentGrid] = useState(null); // null = show initial, otherwise show this

	// Fetch and convert puzzle metadata (emoji, name, initial grids)
	const { data: rawPuzzleData } = usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

	// Firestore mutations
	const { mutate: recordPuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid when puzzle/savedGame/gridSize changes
	useEffect(() => {
		if (!puzzleData) return;

		const initial = puzzleData[gridSize];
		if (!initial) return;

		Promise.resolve().then(() => {
			if (savedGame) {
				// Resume from saved progress
				setCurrentGrid(convertGridFromFirestore(savedGame.grid));
				setInitialGrid(initial);
			} else {
				// Start fresh
				setInitialGrid(initial);
				setCurrentGrid(null); // null means "show initialGrid"

				// Record game start in Firestore
				if (user) {
					recordPuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid: initial,
					});
				}
			}
		});
	}, [puzzleData, savedGame, gridSize, user, recordPuzzleStart]);

	// Restore anonymous game state when user signs in
	useEffect(() => {
		if (!user || !puzzleData) return;

		// Check if there's anonymous game state to restore
		const gameStateKey = `anonymous_game_${puzzleData.id}_${gridSize}`;
		const savedState = localStorage.getItem(gameStateKey);

		if (savedState) {
			try {
				const gameState = JSON.parse(savedState);

				// Save the anonymous progress to Firestore
				// First, record the puzzle start with initial grid
				recordPuzzleStart({
					puzzleId: gameState.puzzleId,
					gridSize: gameState.gridSize,
					initialGrid: gameState.initialGrid,
				});

				// Then save current progress
				saveMove({
					puzzleId: gameState.puzzleId,
					gridSize: gameState.gridSize,
					grid: gameState.grid,
				});

				// Clear localStorage since it's now saved to Firestore
				localStorage.removeItem(gameStateKey);

				console.log("[GAME] Restored anonymous game state to Firestore");
			} catch (error) {
				console.error("[GAME] Error restoring anonymous game:", error);
			}
		}
	}, [user, puzzleData, gridSize, recordPuzzleStart, saveMove]);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		if (user && puzzleData) {
			// Signed in: save to Firestore
			saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				grid: newGrid,
			});
		} else if (puzzleData) {
			// Not signed in: save to localStorage as backup
			// This allows preserving progress when user signs in later
			const gameStateKey = `anonymous_game_${puzzleData.id}_${gridSize}`;
			localStorage.setItem(
				gameStateKey,
				JSON.stringify({
					puzzleId: puzzleData.id,
					gridSize,
					grid: newGrid,
					initialGrid: initialGrid,
					savedAt: new Date().toISOString(),
				}),
			);
		}
	};

	// Handle puzzle completion
	const handleWin = () => {
		if (user && puzzleData) {
			// Update cache immediately for instant trophy display
			queryClient.setQueryData(["user", user.uid], (prevData) =>
				addPuzzleSolution(prevData, puzzleId, gridSize, {
					completedAt: new Date(),
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				}),
			);

			// Save completion to Firestore
			saveCompletion({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
		}

		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setCurrentGrid(null); // Clear current grid to show initial

		// Record restart in Firestore
		if (user && initialGrid && puzzleData) {
			recordPuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid,
			});
		}
	};

	// Game decides which grid to show (smart logic here)
	const gridToShow = currentGrid || initialGrid;

	// Wait for puzzle data and grid initialization
	if (!puzzleData || !gridToShow) {
		return (
			<main className={styles.main}>
				<div style={{ padding: "20px", textAlign: "center" }}>
					Loading puzzle...
				</div>
			</main>
		);
	}

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<Trophy
						trophyNum={String(puzzleData.id).padStart(3, "0")}
						trophyEmoji={puzzleData.emoji}
						trophyName={puzzleData.emojiName}
						maxGridSizeSolved={maxGridSizeSolved}
					/>
				</div>
				<Grid
					size={gridSize}
					onWin={handleWin}
					hasNumbersShown={hasNumbersShown && !showWinDialog}
					emoji={puzzleData.emoji}
					grid={gridToShow}
					onMove={handleMove}
					hasSoundEnabled={hasSoundEnabled}
				/>

				<div className={styles.restartContainer}>
					<button
						className={`${styles.restartButton} ${styles.visible}`}
						onClick={handleRestartClick}
						title="Restart Puzzle"
					>
						<FontAwesomeIcon icon="redo" />
						Restart
					</button>
				</div>
			</main>

			<ConfirmRestartDialog
				isOpen={showRestartDialog}
				onClose={() => setShowRestartDialog(false)}
				onConfirm={handleRestartConfirm}
			/>

			<WinDialog
				isOpen={showWinDialog}
				onClose={() => setShowWinDialog(false)}
				puzzleData={puzzleData}
				gridSize={gridSize}
			/>
		</>
	);
}

export default Game;
