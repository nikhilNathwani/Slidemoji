import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
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
import { getSolvedState } from "../../utils/gridHelpers";

function Game({
	puzzleId,
	gridSize,
	savedGame,
	maxGridSizeSolved = 0,
	hasNumbersShown,
	hasSoundEnabled,
	onOpenStats, // For "View Trophies" button
	onGridSizeChange, // For "Try Hard mode?" button
}) {
	const { user, signIn } = useAuth();
	const queryClient = useQueryClient();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Grid state - Game decides what to show
	const [currentGrid, setCurrentGrid] = useState(null); // null = show initial grid from puzzleData, otherwise show this
	const [isCompleted, setIsCompleted] = useState(false); // Track if puzzle is completed

	// Track max grid size solved in this session (for signed-out users)
	const [localMaxGridSizeSolved, setLocalMaxGridSizeSolved] = useState(0);

	// Fetch and convert puzzle metadata (emoji, name, initial grids)
	const { data: rawPuzzleData } = usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

	// Firestore mutations
	const { mutate: savePuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid on mount
	// Note: Component remounts when user/puzzleId/gridSize changes (via key prop on parent div)
	useEffect(() => {
		if (!puzzleData?.[gridSize]) return;

		// Don't reset if puzzle is already completed (prevents scrambling after win)
		if (isCompleted) return;

		Promise.resolve().then(() => {
			const localStorageKey = `signedOutProgress_${puzzleId}_${gridSize}`;
			const savedData = localStorage.getItem(localStorageKey);

			// Priority 1: Firestore saved game (when signed in)
			if (savedGame) {
				setCurrentGrid(convertGridFromFirestore(savedGame.grid));
				
				// If there's also localStorage data from being signed out, migrate it
				if (savedData && user) {
					const { isCompleted: wasCompleted } = JSON.parse(savedData);
					
					// Migrate completed puzzles (signing in should never lose a trophy)
					if (wasCompleted) {
						saveCompletion({
							puzzleId: puzzleData.id,
							gridSize,
							emoji: puzzleData.emoji,
							emojiName: puzzleData.emojiName,
						});
						console.log("[GAME] Migrated completion from localStorage");
					}
					// Note: In-progress localStorage data is discarded (Firestore state takes precedence)
					
					localStorage.removeItem(localStorageKey);
				}
			}
			// Priority 2: localStorage data (when signed in with no Firestore save, but had signed-out progress)
			else if (savedData && user) {
				const { isCompleted: wasCompleted, grid, initialGrid } = JSON.parse(savedData);
				
				if (wasCompleted) {
					// Migrate completion
					saveCompletion({
						puzzleId: puzzleData.id,
						gridSize,
						emoji: puzzleData.emoji,
						emojiName: puzzleData.emojiName,
					});
					setCurrentGrid(grid); // Show solved grid
					console.log("[GAME] Migrated completion from localStorage");
				} else if (grid && initialGrid) {
					// Migrate in-progress work
					savePuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid,
					});
					saveMove({
						puzzleId: puzzleData.id,
						gridSize,
						grid,
					});
					setCurrentGrid(grid); // Resume from saved progress
					console.log("[GAME] Migrated progress from localStorage");
				}
				
				localStorage.removeItem(localStorageKey);
			}
			// Priority 3: Start fresh
			else {
				setCurrentGrid(null); // null means "show initialGrid"

				// Save game start to Firestore (when signed in)
				if (user) {
					savePuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid: puzzleData[gridSize],
					});
				}
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [puzzleData, savedGame, user, savePuzzleStart, saveMove, saveCompletion, isCompleted]);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setCurrentGrid(newGrid);

		if (user && puzzleData) {
			// Signed in: save to Firestore
			saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				grid: newGrid,
			});
		} else if (puzzleData) {
			// Signed out: save to localStorage
			const localStorageKey = `signedOutProgress_${puzzleId}_${gridSize}`;
			localStorage.setItem(
				localStorageKey,
				JSON.stringify({
					isCompleted: false,
					grid: newGrid,
					initialGrid: puzzleData[gridSize],
				}),
			);
		}
	};

	// Handle puzzle completion
	const handleWin = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(gridSize);
		setCurrentGrid(solvedGrid);

		setIsCompleted(true); // Mark puzzle as completed to prevent grid reset

		// Update local max grid size (for signed-out trophy color)
		setLocalMaxGridSizeSolved((prev) => Math.max(prev, gridSize));

		if (user && puzzleData) {
			// Signed in: save to Firestore
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
		} else if (puzzleData) {
			// Signed out: save completion to localStorage
			const localStorageKey = `signedOutProgress_${puzzleId}_${gridSize}`;
			localStorage.setItem(
				localStorageKey,
				JSON.stringify({
					isCompleted: true,
					grid: solvedGrid,
					initialGrid: puzzleData[gridSize],
				}),
			);
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
		setIsCompleted(false); // Reset completion state

		// Save restart to Firestore
		if (user && puzzleData) {
			savePuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}
	};

	// Game decides which grid to show (smart logic here)
	const gridToShow = currentGrid || puzzleData?.[gridSize];

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
						maxGridSizeSolved={Math.max(
							maxGridSizeSolved,
							localMaxGridSizeSolved,
						)}
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
					<GameActionButton
						isCompleted={isCompleted}
						user={user}
						gridSize={gridSize}
						maxGridSizeSolved={maxGridSizeSolved}
						onSignIn={signIn}
						onOpenStats={onOpenStats}
						onGridSizeChange={onGridSizeChange}
						onRestart={handleRestartClick}
					/>
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
