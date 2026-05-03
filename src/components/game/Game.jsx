import { useState } from "react";
import styles from "./Game.module.css";
import Grid from "./Grid";
import Trophy from "../common/Trophy";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import GameActionButton from "./GameActionButton";
import { useAuth } from "../../auth/useAuth";
import { usePreference } from "../../hooks/usePreference";
import { checkWin } from "../../utils/gridHelpers";
import { WIN_DIALOG_DELAY_MS } from "../../utils/constants";

function Game({
	puzzleId, // Puzzle ID number
	emoji, // Puzzle emoji
	emojiName, // Emoji name (e.g., "Jack-O-Lantern")
	initialGrid, // Initial grid for current difficulty
	currentGrid, // Current grid array
	currentDifficulty, // Current difficulty ("normal"|"hard")
	setGameState, // Function to update game state: setGameState({ currentDifficulty?, normal?, hard? })
	onOpenArchive,
	isAppDialogOpen = false,
}) {
	const [showNumbers] = usePreference("showNumbers");
	const [soundEnabled] = usePreference("soundEnabled");
	const { user } = useAuth();
	const isSolved = checkWin(currentGrid);

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const isDialogOpen = isAppDialogOpen || showRestartDialog || showWinDialog;

	// Incremented each time the player makes a move that solves the puzzle.
	// Trophy detects any change as a new celebration event — no directional
	// check needed, and no reset required on difficulty switch or restart.
	const [celebrationKey, setCelebrationKey] = useState(0);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		setGameState({ [currentDifficulty]: newGrid });
	};

	// Handle puzzle solve — delay dialog so the user can relish the solved state
	const handleSolve = () => {
		setCelebrationKey((k) => k + 1);
		setTimeout(() => setShowWinDialog(true), WIN_DIALOG_DELAY_MS);
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
						isEarned={isSolved}
						difficulty={currentDifficulty}
						celebrationKey={celebrationKey}
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
						puzzleId={puzzleId}
						onShowResults={() => setShowWinDialog(true)}
						onOpenArchive={onOpenArchive}
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
				onUnlockArchiveClick={() => {
					setShowWinDialog(false);
					onOpenArchive();
				}}
			/>
		</>
	);
}

export default Game;
