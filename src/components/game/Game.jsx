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
import {
	initializeGameState,
	saveGameProgress,
	saveGameCompletion,
	saveGameRestart,
} from "../../utils/gameState";

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

	// Track max grid size solved IN THIS SESSION for signed-out users (for trophy color)
	// Resets to 0 on refresh (session-only, not persisted)
	// Signed-in users use maxGridSizeSolved prop from Firestore (persisted)
	const [signedOutMaxSolved, setSignedOutMaxSolved] = useState(0);

	// Firestore mutations
	const { mutate: savePuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid on mount
	// Note: Component remounts when user/puzzleId/gridSize changes (via key prop on parent div)
	// We need useEffect because we're performing side effects (storage operations, mutations)
	// App ensures all data (puzzleData, savedGame) is ready before mounting Game
	useEffect(() => {
		const { initialGrid, isCompleted: wasCompleted } = initializeGameState({
			puzzleId,
			gridSize,
			puzzleData,
			savedGame,
			user,
			mutations: {
				savePuzzleStart,
				saveMove,
				saveCompletion,
			},
		});

		setCurrentGrid(initialGrid);
		setIsCompleted(wasCompleted);
		// Empty deps: runs once on mount, all data is ready via props
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setCurrentGrid(newGrid);

		saveGameProgress({
			puzzleId,
			gridSize,
			grid: newGrid,
			puzzleData,
			user,
			saveMoveToFirestore: saveMove,
		});
	};

	// Handle puzzle completion
	const handleWin = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(gridSize);
		setCurrentGrid(solvedGrid);

		setIsCompleted(true);

		saveGameCompletion({
			puzzleId,
			gridSize,
			grid: solvedGrid,
			puzzleData,
			user,
			saveCompletionToFirestore: saveCompletion,
			updateCacheImmediately: () => {
				// Update cache immediately for instant trophy display
				queryClient.setQueryData(["user", user.uid], (prevData) =>
					addPuzzleSolution(prevData, puzzleId, gridSize, {
						completedAt: new Date(),
						emoji: puzzleData.emoji,
						emojiName: puzzleData.emojiName,
					}),
				);
			},
		});

		// For signed-out users, update session max (trophy persists until refresh)
		if (!user) {
			setSignedOutMaxSolved((prev) => Math.max(prev, gridSize));
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

		saveGameRestart({
			gridSize,
			puzzleData,
			user,
			savePuzzleStart,
		});
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
						maxGridSizeSolved={
							user ? maxGridSizeSolved : signedOutMaxSolved
						}
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
