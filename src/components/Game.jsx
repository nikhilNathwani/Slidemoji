import { useState, useRef, useEffect } from "react";
import styles from "./Game.module.css";
import Board from "./Board";
import Trophy from "./common/Trophy";
import Dialog from "./dialogs/Dialog";
import ConfirmContent from "./dialogs/ConfirmContent";

function Game({
	dailyEmoji,
	gridSize,
	onWin,
	showNumbers,
	isWon,
	onSolveRef,
	playingEntranceAnimation,
	showControls,
	onShuffle,
	highestEarnedDifficulty = 0,
}) {
	const [showRestartConfirm, setShowRestartConfirm] = useState(false);
	const solveRef = useRef(null);
	const restartRef = useRef(null);

	// Expose solve ref to parent component (for Settings dialog)
	useEffect(() => {
		if (onSolveRef) {
			onSolveRef.current = () => {
				if (solveRef.current) {
					solveRef.current();
				}
			};
		}
	}, [onSolveRef]);

	const handleRestartClick = () => {
		setShowRestartConfirm(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartConfirm(false);
		if (onShuffle) {
			onShuffle(); // Reset isWon in parent
		}
		if (restartRef.current) {
			restartRef.current();
		}
	};

	return (
		<>
			<main className={styles.main}>
				<Trophy
					trophyNum="001"
					trophyEmoji={dailyEmoji.emoji}
					trophyName={dailyEmoji.name}
					isEarned={highestEarnedDifficulty > 0}
					difficulty={highestEarnedDifficulty || gridSize}
					visible={showControls}
				/>

				<div className={styles.boardContainer}>
					<Board
						size={gridSize}
						onWin={onWin}
						showNumbers={showNumbers && !isWon}
						onSolveRef={solveRef}
						onShuffleRef={restartRef}
						dailyEmoji={dailyEmoji.emoji}
						playingEntranceAnimation={playingEntranceAnimation}
					/>

					<button
						className={`${styles.restartButton} ${showControls ? styles.visible : styles.hidden}`}
						onClick={handleRestartClick}
						title="Restart Puzzle"
					>
						<i className="fas fa-redo"></i>
						Restart
					</button>
				</div>
			</main>

			<Dialog
				isOpen={showRestartConfirm}
				onClose={() => setShowRestartConfirm(false)}
				title="Restart Puzzle?"
			>
				<ConfirmContent
					message="This will restart the puzzle and reset your current progress. Are you sure?"
					onConfirm={handleRestartConfirm}
					onCancel={() => setShowRestartConfirm(false)}
				/>
			</Dialog>
		</>
	);
}

export default Game;
