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
	const { user } = useAuth();

	// Load game state on mount - handles resuming or starting fresh
	// Component remounts when user/puzzleId/gridSize changes (via key prop in App)
	const { loadedGrid, wasSolved } = useLoadGame({
		puzzleId,
		gridSize,
		puzzleData,
		savedGame,
	});

	// Grid state - Game manages current gameplay state
	const [currentGrid, setCurrentGrid] = useState(loadedGrid);
	const [isSolved, setIsSolved] = useState(wasSolved);

	// Game state persistence - handles Firestore (signed in) and localStorage (signed out)
	const { saveMove, saveSolution, saveRestart } = useSaveGame();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setCurrentGrid(newGrid);

		saveMove({
			puzzleId,
			gridSize,
			grid: newGrid,
			puzzleData,
		});
	};

	// Handle puzzle solution
	const handleSolve = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(gridSize);
		setCurrentGrid(solvedGrid);

		setIsSolved(true);

		saveSolution({
			puzzleId,
			gridSize,
			puzzleData,
		});

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

		saveRestart({
			gridSize,
			puzzleData,
		});
	};

	// Game decides which grid to show
	const gridToShow = currentGrid || puzzleData[gridSize];

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
					onWin={handleSolve}
					hasNumbersShown={hasNumbersShown && !showWinDialog && !isSolved}
					emoji={puzzleData.emoji}
					grid={gridToShow}
					onMove={handleMove}
					hasSoundEnabled={hasSoundEnabled}
				/>

				<div className={styles.restartContainer}>
					<GameActionButton
						isSolved={isSolved}
						user={user}
						gridSize={gridSize}
						maxGridSizeSolved={maxGridSizeSolved}
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
