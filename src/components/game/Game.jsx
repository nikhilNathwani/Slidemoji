import { useState } from "react";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
import { useAuth } from "../../hooks/useAuth";
import { usePreference } from "../../hooks/usePreference";
import { checkWin } from "../../utils/gridHelpers";

function Game({
	puzzleId, // Puzzle ID number
	emoji, // Puzzle emoji
	emojiName, // Emoji name (e.g., "Jack-O-Lantern")
	initialGrid, // Initial grid for current difficulty
	currentGrid, // Current grid array
	currentDifficulty, // Current difficulty ("normal"|"hard")
	setGameState, // Function to update game state: setGameState({ currentDifficulty?, normal?, hard? })
	onOpenStats,
	isAppDialogOpen = false,
	solvedPuzzles = {},
}) {
	const [showNumbers] = usePreference("showNumbers");
	const [soundEnabled] = usePreference("soundEnabled");
	const { user } = useAuth();
	const isSolved = checkWin(currentGrid);

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const isDialogOpen = isAppDialogOpen || showRestartDialog || showWinDialog;

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setGameState({ [currentDifficulty]: newGrid });
	};

	// Handle puzzle solve
	const handleSolve = () => {
		// Grid already saved the winning move via onMove, so grid is already solved
		// setGameState with solved grid was already called in handleMove, no need to call again
		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setGameState({
			[currentDifficulty]: initialGrid,
		});
	};

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<Trophy
						trophyNum={puzzleId}
						trophyEmoji={emoji}
						trophyName={emojiName}
						isSolved={isSolved}
						difficulty={currentDifficulty}
					/>
				</div>
				<Grid
					grid={currentGrid}
					emoji={emoji}
					hasNumbersShown={showNumbers && !isSolved}
					hasSoundEnabled={soundEnabled}
					onMove={handleMove}
					onWin={handleSolve}
					isDialogOpen={isDialogOpen}
				/>

				<div className={styles.restartContainer}>
					<GameActionButton
						isSolved={isSolved}
						isSignedIn={user?.isAnonymous === false}
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
				puzzleId={puzzleId}
				emoji={emoji}
				emojiName={emojiName}
				difficulty={currentDifficulty}
				solvedPuzzles={solvedPuzzles}
			/>
		</>
	);
}

export default Game;
