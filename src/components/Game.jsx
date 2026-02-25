import { useState, useRef, useEffect } from "react";
import styles from "./Game.module.css";
import Board from "./Board";
import PuzzleInfo from "./PuzzleInfo";
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
}) {
	const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
	const solveRef = useRef(null);
	const shuffleRef = useRef(null);

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

	const handleShuffleClick = () => {
		setShowShuffleConfirm(true);
	};

	const handleShuffleConfirm = () => {
		setShowShuffleConfirm(false);
		if (onShuffle) {
			onShuffle(); // Reset isWon in parent
		}
		if (shuffleRef.current) {
			shuffleRef.current();
		}
	};

	return (
		<>
			<main className={styles.main}>
				<PuzzleInfo
					puzzleNumber="001"
					emoji={dailyEmoji.emoji}
					emojiName={dailyEmoji.name}
					visible={showControls}
				/>

				<div className={styles.boardContainer}>
					<Board
						size={gridSize}
						onWin={onWin}
						showNumbers={showNumbers && !isWon}
						onSolveRef={solveRef}
						onShuffleRef={shuffleRef}
						dailyEmoji={dailyEmoji.emoji}
						playingEntranceAnimation={playingEntranceAnimation}
					/>

					<button
						className={`${styles.shuffleButton} ${showControls ? styles.visible : styles.hidden}`}
						onClick={handleShuffleClick}
						title="Shuffle Board"
					>
						<i className="fas fa-random"></i>
						Shuffle
					</button>
				</div>
			</main>

			<Dialog
				isOpen={showShuffleConfirm}
				onClose={() => setShowShuffleConfirm(false)}
				title="Shuffle Board?"
			>
				<ConfirmContent
					message="This will shuffle the board and reset your current progress. Are you sure?"
					onConfirm={handleShuffleConfirm}
					onCancel={() => setShowShuffleConfirm(false)}
				/>
			</Dialog>
		</>
	);
}

export default Game;
