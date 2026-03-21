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
import { getSolvedState } from "../../utils/gridHelpers";
import { GRID_SIZE } from "../../constants";

function Game({
	puzzleMetadata, // Contains: id, emoji, emojiName, initialGrid
	savedGame,
	isSolved: wasPreviouslySolved = false, // Passed from App (checks Firestore solvedPuzzles)
	hasNumbersShown,
	hasSoundEnabled,
	onOpenStats,
}) {
	const puzzleId = puzzleMetadata.id;
	const { user } = useAuth();

	// Load game state on mount - handles resuming or starting fresh (3x3 only)
	// Component remounts when user/puzzleId changes (via key prop in App)
	const { loadedGrid, wasSolved } = useLoadGame({
		puzzleId,
		puzzleData: puzzleMetadata,
		savedGame,
	});

	// Grid state - Game manages current gameplay state
	const [currentGrid, setCurrentGrid] = useState(loadedGrid);
	// isSolved tracks current session state. Initialize from:
	// 1. wasSolved (from localStorage/migration check in useLoadGame)
	// 2. wasPreviouslySolved (from Firestore solvedPuzzles check in App)
	const [isSolved, setIsSolved] = useState(wasSolved || wasPreviouslySolved);

	// Game state persistence - handles Firestore (signed in) and localStorage (signed out)
	const { saveMove, saveSolution, saveRestart } = useSaveGame();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setCurrentGrid(newGrid);
		saveMove({ grid: newGrid, puzzleMetadata });
	};

	// Handle puzzle solution
	const handleSolve = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(GRID_SIZE);
		setCurrentGrid(solvedGrid);
		setIsSolved(true);
		saveSolution({ puzzleMetadata });
		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setCurrentGrid(null); // Clear current grid to show initial
		setIsSolved(false); // Reset solved state
		saveRestart({ puzzleMetadata });
	};

	// Game decides which grid to show
	const gridToShow = currentGrid || puzzleMetadata.initialGrid;

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
					size={GRID_SIZE}
					onWin={handleSolve}
					hasNumbersShown={hasNumbersShown && !isSolved}
					emoji={puzzleMetadata.emoji}
					grid={gridToShow}
					onMove={handleMove}
					hasSoundEnabled={hasSoundEnabled}
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
