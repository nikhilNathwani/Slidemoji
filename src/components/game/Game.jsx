import { useState } from "react";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
import { useAuth } from "../../hooks/useAuth";
import { useLoadGame } from "../../hooks/useLoadGame";
import { useSaveGame } from "../../hooks/useSaveGame";
import { GRID_SIZE } from "../../constants";

function Game({
	puzzleMetadata, // Contains: id, emoji, emojiName, initialGrid
	savedGame,
	solvedPuzzles, // Firestore solvedPuzzles map (for checking if already completed)
	hasNumbersShown,
	hasSoundEnabled,
	onOpenStats,
	isAppDialogOpen = false,
}) {
	const puzzleId = puzzleMetadata.id;
	const { user } = useAuth();

	// Load game state on mount - handles resuming or starting fresh (3x3 only)
	// Component remounts when user/puzzleId changes (via key prop in App)
	// useLoadGame checks: Firestore solvedPuzzles, Firestore gameState, and localStorage
	const { loadedGrid, wasSolved } = useLoadGame({
		puzzleId,
		puzzleMetadata,
		savedGame,
		solvedPuzzles,
	});

	// Grid state - Game manages current gameplay state
	const [currentGrid, setCurrentGrid] = useState(loadedGrid);
	// isSolved tracks current session state, initialized from useLoadGame's wasSolved check
	const [isSolved, setIsSolved] = useState(wasSolved);

	// Game state persistence - handles Firestore (signed in) and localStorage (signed out)
	const { saveMove, saveSolve, saveRestart } = useSaveGame();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const isDialogOpen = isAppDialogOpen || showRestartDialog || showWinDialog;

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setCurrentGrid(newGrid);
		saveMove({ grid: newGrid, puzzleMetadata });
	};

	// Handle puzzle solve
	const handleSolve = () => {
		// Grid already saved the winning move via onMove, so currentGrid is already solved
		setIsSolved(true);
		saveSolve({ puzzleMetadata });
		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setCurrentGrid(puzzleMetadata.initialGrid); // Reset to initial grid (Grid displays what's passed)
		setIsSolved(false); // Reset solved state
		saveRestart({ puzzleMetadata });
	};

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<Trophy
						trophyNum={String(puzzleMetadata.id).padStart(3, "0")}
						trophyEmoji={puzzleMetadata.emoji}
						trophyName={puzzleMetadata.emojiName}
						isSolved={isSolved}
					/>
				</div>
				<Grid
					grid={currentGrid || puzzleMetadata.initialGrid}
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
			/>
		</>
	);
}

export default Game;
