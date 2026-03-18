import { useState, useEffect, useMemo, useRef } from "react";
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
	const [initialGrid, setInitialGrid] = useState(null); // Stored in state for restart button & gridToShow
	const [currentGrid, setCurrentGrid] = useState(null); // null = show initial, otherwise show this
	const [isCompleted, setIsCompleted] = useState(false); // Track if puzzle is completed

	// Track max grid size solved in this session (for signed-out users)
	const [localMaxGridSizeSolved, setLocalMaxGridSizeSolved] = useState(0);

	// Track previous user for sign-in/sign-out detection
	const prevUserRef = useRef(user);

	// Fetch and convert puzzle metadata (emoji, name, initial grids)
	const { data: rawPuzzleData } = usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

	// Firestore mutations
	const { mutate: savePuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid when puzzle/savedGame loads or changes
	// Note: gridSize not in deps because component remounts when it changes (via key prop)
	useEffect(() => {
		if (!puzzleData) return;

		const puzzleInitialGrid = puzzleData[gridSize];
		if (!puzzleInitialGrid) return;

		// Don't reset if puzzle is already completed (prevents scrambling after win)
		if (isCompleted) return;

		Promise.resolve().then(() => {
			// Store initial grid for restart functionality
			setInitialGrid(puzzleInitialGrid);

			if (savedGame) {
				// Resume from saved progress
				setCurrentGrid(convertGridFromFirestore(savedGame.grid));
			} else {
				// Start fresh - null means "show initialGrid"
				setCurrentGrid(null);

				// Save game start to Firestore
				if (user) {
					savePuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid: puzzleInitialGrid,
					});
				}
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [puzzleData, savedGame, user, savePuzzleStart, isCompleted]);

	// Handle sign-in and sign-out transitions
	useEffect(() => {
		const wasSignedOut = !prevUserRef.current;
		const isNowSignedIn = !!user;
		const wasSignedIn = !!prevUserRef.current;
		const isNowSignedOut = !user;

		// ===== SIGN IN: Preserve trophies and progress =====
		if (wasSignedOut && isNowSignedIn && puzzleData) {
			// Save trophy if puzzle was completed while signed out
			if (isCompleted) {
				saveCompletion({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				console.log("[GAME] Saved completion after sign-in");
			}
			// Preserve in-progress work if no cloud save
			else if (currentGrid && initialGrid && !savedGame) {
				savePuzzleStart({
					puzzleId: puzzleData.id,
					gridSize,
					initialGrid,
				});
				saveMove({
					puzzleId: puzzleData.id,
					gridSize,
					grid: currentGrid,
				});
				console.log("[GAME] Preserved progress after sign-in");
			}
		}

		// ===== SIGN OUT: Reset to fresh state =====
		if (wasSignedIn && isNowSignedOut) {
			setCurrentGrid(null);
			setIsCompleted(false);
			setLocalMaxGridSizeSolved(0);
			console.log("[GAME] Reset state after sign-out");
		}

		prevUserRef.current = user;
	}, [
		user,
		isCompleted,
		currentGrid,
		initialGrid,
		savedGame,
		puzzleData,
		gridSize,
		saveCompletion,
		savePuzzleStart,
		saveMove,
	]);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		if (user && puzzleData) {
			// Signed in: save to Firestore
			saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				grid: newGrid,
			});
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
		setIsCompleted(false); // Reset completion state

		// Save restart to Firestore
		if (user && initialGrid && puzzleData) {
			savePuzzleStart({
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
