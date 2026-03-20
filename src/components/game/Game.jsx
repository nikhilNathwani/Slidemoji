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
	const { user, signIn } = useAuth();

	// Initialize grid on mount - handles loading saved games and localStorage migration
	// Component remounts when user/puzzleId/gridSize changes (via key prop in App)
	const { initialGrid, wasCompleted } = useLoadGame({
		puzzleId,
		gridSize,
		puzzleData,
		savedGame,
	});

	// Game state persistence - handles Firestore (signed in) and localStorage (signed out)
	const { saveMove, saveCompletion, saveRestart } = useSaveGame();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Grid state - Game manages current gameplay state
	const [currentGrid, setCurrentGrid] = useState(initialGrid);
	const [isCompleted, setIsCompleted] = useState(wasCompleted);

	// Track max grid size solved for signed-out users (persists until next puzzle)
	// Signed-in users use maxGridSizeSolved prop from Firestore (persisted forever)
	const [signedOutMaxSolved, setSignedOutMaxSolved] = useState(() => {
		if (user) return 0; // Signed-in users don't need this

		// Check localStorage for today's puzzle completions
		const key = `signedOutProgress_${puzzleId}_3`;
		const saved3 = localStorage.getItem(key);
		const key4 = `signedOutProgress_${puzzleId}_4`;
		const saved4 = localStorage.getItem(key4);
		const key5 = `signedOutProgress_${puzzleId}_5`;
		const saved5 = localStorage.getItem(key5);

		let maxSolved = 0;
		if (saved3 && JSON.parse(saved3).isCompleted) maxSolved = 3;
		if (saved4 && JSON.parse(saved4).isCompleted) maxSolved = 4;
		if (saved5 && JSON.parse(saved5).isCompleted) maxSolved = 5;

		return maxSolved;
	});

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

	// Handle puzzle completion
	const handleWin = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(gridSize);
		setCurrentGrid(solvedGrid);

		setIsCompleted(true);

		saveCompletion({
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
		setIsCompleted(false); // Reset completion state

		saveRestart({
			gridSize,
			puzzleData,
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
