import { useState } from "react";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
import { useAuth } from "../../hooks/useAuth";
import { checkWin, getSolvedState } from "../../utils/gridHelpers";
import { getDifficultySize } from "../../constants";

function Game({
	puzzleMetadata, // { id, emoji, emojiName, initialGrids: { normal, hard } }
	gameState, // { normal: grid, hard: grid, currentDifficulty: "normal"|"hard" }
	setGameState, // Function to update game state: setGameState(grid) - infers action & difficulty
	hasNumbersShown,
	hasSoundEnabled,
	onOpenStats,
	isAppDialogOpen = false,
}) {
	const { user } = useAuth();

	// Extract data from gameState and puzzleMetadata
	const puzzleId = puzzleMetadata.id;
	const currentDifficulty = gameState.currentDifficulty;
	const currentGrid = gameState[currentDifficulty];

	// Derive isSolved from gameState
	const gridSize = getDifficultySize(currentDifficulty);
	const solvedState = getSolvedState(gridSize);
	const isSolved = checkWin(currentGrid, solvedState);

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const isDialogOpen = isAppDialogOpen || showRestartDialog || showWinDialog;

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setGameState(newGrid);
	};

	// Handle puzzle solve
	const handleSolve = () => {
		// Grid already saved the winning move via onMove, so currentGrid is already solved
		// setGameState with solved grid was already called in handleMove, no need to call again
		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setGameState(puzzleMetadata.initialGrids[currentDifficulty]);
	};

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<Trophy
						trophyNum={String(puzzleId).padStart(3, "0")}
						trophyEmoji={puzzleMetadata.emoji}
						trophyName={puzzleMetadata.emojiName}
						solvedDifficulty={
							// Check if this difficulty has been beaten (derive from gameState)
							checkWin(gameState[currentDifficulty], solvedState)
								? currentDifficulty
								: null
						}
					/>
				</div>
				<Grid
					grid={currentGrid}
					emoji={puzzleMetadata.emoji}
					hasNumbersShown={hasNumbersShown && !isSolved}
					hasSoundEnabled={hasSoundEnabled}
					onMove={handleMove}
					onWin={handleSolve}
					isDialogOpen={isDialogOpen}
				/>

				<div className={styles.restartContainer}>
					<GameActionButton
						isSolved={isSolved}
						user={user}
						onOpenStats={onOpenStats}
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
				puzzleMetadata={puzzleMetadata}
				difficulty={currentDifficulty}
			/>
		</>
	);
}

export default Game;
