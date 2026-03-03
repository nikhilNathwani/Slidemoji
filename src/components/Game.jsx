import { useState, useRef, useEffect } from "react";
import styles from "./Game.module.css";
import Board from "./Board";
import Trophy from "./common/Trophy";
import Dialog from "./dialogs/Dialog";
import ConfirmContent from "./dialogs/ConfirmContent";
import { useAuth } from "../hooks/useAuth";
import { startPuzzle, saveGameState, saveCompletion } from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";

function Game({
	dailyEmoji,
	gridSize,
	onWin,
	onShowWinDialog,
	showNumbers,
	isWon,
	onSolveRef,
	playingEntranceAnimation,
	showControls,
	onShuffle,
	highestEarnedDifficulty = 0,
	userData,
	puzzleData,
	puzzleId,
	difficulty,
}) {
	const { user } = useAuth();
	const [showRestartConfirm, setShowRestartConfirm] = useState(false);
	const [moves, setMoves] = useState(0);
	const [startedAt, setStartedAt] = useState(null);
	const [initialBoard, setInitialBoard] = useState(null);
	const [savedBoard, setSavedBoard] = useState(null);
	const solveRef = useRef(null);
	const restartRef = useRef(null);

	// Load initial or saved board state
	useEffect(() => {
		if (!puzzleData || !user) return;

		const savedGame = userData?.gameState?.[puzzleId]?.[difficulty];
		const boardKey = difficulty === 3 ? "initialBoard3x3" : "initialBoard4x4";
		const initial = puzzleData[boardKey];

		if (savedGame) {
			// Resume saved game
			setSavedBoard(savedGame.board);
			setMoves(savedGame.moves);
			setStartedAt(savedGame.startedAt);
			setInitialBoard(initial);
		} else if (initial) {
			// Start fresh
			setInitialBoard(initial);
			setSavedBoard(null);
			setMoves(0);
			const now = Timestamp.now();
			setStartedAt(now);

			// Call startPuzzle to update play streak
			startPuzzle(user.uid, puzzleId, difficulty, initial).catch((error) => {
				console.error("Error starting puzzle:", error);
			});
		}
	}, [puzzleData, puzzleId, difficulty, userData, user]);

	// Handle move (called by Board)
	const handleMove = (newBoard) => {
		const newMoves = moves + 1;
		setMoves(newMoves);

		// Save to Firestore
		if (user) {
			saveGameState(user.uid, puzzleId, difficulty, {
				moves: newMoves,
				board: newBoard,
			}).catch((error) => {
				console.error("Error saving game state:", error);
			});
		}
	};

	// Handle win (called by Board)
	const handleWin = () => {
		onWin();

		// Save completion to Firestore
		if (user) {
			saveCompletion(user.uid, puzzleId, difficulty, {
				moves,
			}).catch((error) => {
				console.error("Error saving completion:", error);
			});
		}
	};

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
		setMoves(0);
		const now = Timestamp.now();
		setStartedAt(now);
		setSavedBoard(null);

		if (onShuffle) {
			onShuffle(); // Reset isWon in parent
		}
		if (restartRef.current) {
			restartRef.current();
		}

		// Re-start puzzle in Firestore
		if (user && initialBoard) {
			startPuzzle(user.uid, puzzleId, difficulty, initialBoard).catch((error) => {
				console.error("Error restarting puzzle:", error);
			});
		}
	};

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<Trophy
						trophyNum={String(puzzleId).padStart(3, "0")}
						trophyEmoji={dailyEmoji.emoji}
						trophyName={dailyEmoji.name}
						isEarned={highestEarnedDifficulty > 0}
						difficulty={highestEarnedDifficulty || gridSize}
						visible={showControls}
					/>
				</div>
				{initialBoard && (
					<Board
						size={gridSize}
						onWin={handleWin}
						onShowWinDialog={onShowWinDialog}
						showNumbers={showNumbers && !isWon}
						onSolveRef={solveRef}
						onShuffleRef={restartRef}
						dailyEmoji={dailyEmoji.emoji}
						playingEntranceAnimation={playingEntranceAnimation}
						initialBoard={initialBoard}
						savedBoard={savedBoard}
						onMove={handleMove}
					/>
				)}

				<div className={styles.restartContainer}>
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
