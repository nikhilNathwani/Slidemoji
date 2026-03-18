import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesomeIcon } from "../../utils/icons";
import {
	useSavePuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "../../hooks/useGameMutations";

import { addPuzzleSolution } from "../../utils/statsHelpers";
import { getSolvedState } from "../../utils/gridHelpers";

function Game({
	puzzleId,
	puzzleData,
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

	// Firestore mutations
	const { mutate: savePuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid on mount
	// Note: Component remounts when user/puzzleId/gridSize changes (via key prop on parent div)
	// We need useEffect because we're performing side effects (localStorage, Firestore mutations)
	// App ensures all data (puzzleData, savedGame) is ready before mounting Game
	useEffect(() => {
		// Helper: Get localStorage key for signed-out progress
		const getLocalStorageKey = () =>
			`signedOutProgress_${puzzleId}_${gridSize}`;

		// Helper: Read signed-out progress from localStorage
		const getLocalProgress = () => {
			const key = getLocalStorageKey();
			const data = localStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		};

		// Helper: Clear localStorage after migration
		const clearLocalProgress = () => {
			localStorage.removeItem(getLocalStorageKey());
		};

		const savedData = getLocalProgress();

		// Helper: Check if savedGame is just the initial grid (no real progress)
		const isInitialGrid = (grid) => {
			if (!grid) return false;
			const initial = puzzleData[gridSize];
			return JSON.stringify(grid) === JSON.stringify(initial);
		};

		const hasFirestoreProgress =
			savedGame && !isInitialGrid(savedGame.grid);

		// Priority 1: Firestore saved game with actual progress (when signed in)
		if (hasFirestoreProgress) {
			setCurrentGrid(savedGame.grid);

			// If there's also localStorage data from being signed out, migrate completions only
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
					setIsCompleted(true); // Mark as completed
					console.log("[GAME] Migrated completion from localStorage");
				}
				// Note: In-progress localStorage data is discarded (Firestore state takes precedence)

				clearLocalProgress();
			}
		}
		// Priority 2: localStorage data (signed out progress, or signed in with no real Firestore progress)
		else if (savedData && user) {
			const { isCompleted: wasCompleted, grid, initialGrid } = savedData;

			if (wasCompleted) {
				// Migrate completion
				saveCompletion({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				setCurrentGrid(grid); // Show solved grid
				setIsCompleted(true); // Mark as completed
				console.log("[GAME] Migrated completion from localStorage");
			} else if (grid && initialGrid) {
				// Migrate in-progress work (better than initial Firestore state or no state)
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

			clearLocalProgress();
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
		// Empty deps: runs once on mount, all data is ready via props
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
			localStorage.setItem(
				`signedOutProgress_${puzzleId}_${gridSize}`,
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
			localStorage.setItem(
				`signedOutProgress_${puzzleId}_${gridSize}`,
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
	const gridToShow = currentGrid || puzzleData[gridSize];

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
