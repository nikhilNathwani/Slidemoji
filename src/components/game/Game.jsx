import { useState, useRef, useEffect } from "react";
import styles from "./Game.module.css";
import Board from "./Board";
import Trophy from "../common/Trophy";
import Dialog from "../dialogs/Dialog";
import ConfirmResetDialog from "../dialogs/ConfirmResetDialog";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesomeIcon } from "../../utils/icons";
import {
	startPuzzle,
	saveGameState,
	saveCompletion,
} from "../../firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { scramblePuzzle } from "../../utils/boardHelpers";

function Game({
	dailyEmoji,
	puzzleData,
	puzzleId,
	difficulty,
	gridSize,
	savedGame,
	highestCompletedDifficulty = 0,
	hasNumbersShown,
	isGameWon,
	hasSoundEnabled,
	onWin,
	onShowWinDialog,
	onShuffle,
}) {
	const { user } = useAuth();
	const [showRestartConfirm, setShowRestartConfirm] = useState(false);
	const [moves, setMoves] = useState(0);
	const [startedAt, setStartedAt] = useState(null);
	const [initialBoard, setInitialBoard] = useState(null);
	const [savedBoard, setSavedBoard] = useState(null);
	const solveRef = useRef(null);
	const restartRef = useRef(null);

	// ===== Load Initial or Saved Board State =====
	// This effect runs when:
	// - Component mounts
	// - Puzzle changes (new day, or switching puzzle in archive mode)
	// - Difficulty changes (3x3 ↔ 4x4)
	// - User data loads/updates
	useEffect(() => {
		// DEVELOPMENT MODE: Allow playing without puzzle data (no persistence)
		// This lets you test the game before uploading puzzles to Firestore
		if (!puzzleData) {
			console.warn(
				"Dev mode: No puzzle data - using random puzzle (no persistence)",
			);
			setInitialBoard(scramblePuzzle(difficulty));
			setSavedBoard(null);
			setMoves(0);
			setStartedAt(Timestamp.now());
			return;
		}

		// Get the correct initial board based on difficulty
		const boardKey =
			difficulty === 3 ? "initialBoard3x3" : "initialBoard4x4";
		const initial = puzzleData[boardKey];

		if (savedGame) {
			// RESUME MODE: User has a saved game, restore it
			// Convert saved board from Firestore format (0 as gap) to client format (null as gap)
			const convertedBoard = savedGame.board.map((v) =>
				v === 0 ? null : v,
			);
			setSavedBoard(convertedBoard);
			setMoves(savedGame.moves);
			setStartedAt(savedGame.startedAt);
			setInitialBoard(initial); // Keep initial for reference
		} else if (initial) {
			// NEW GAME MODE: Start fresh with initial board
			setInitialBoard(initial);
			setSavedBoard(null);
			setMoves(0);
			const now = Timestamp.now();
			setStartedAt(now);

			// Call startPuzzle to:
			// - Create gameState entry in Firestore
			// - Update play streak (if daily puzzle)
			// - Increment totalAttempted (if first time)
			// Skip in dev mode when no real user is signed in
			if (user) {
				startPuzzle(user.uid, puzzleId, difficulty, initial).catch(
					(error) => {
						console.error("Error starting puzzle:", error);
					},
				);
			}
		}
	}, [puzzleData, puzzleId, difficulty, savedGame, user]);

	// ===== Handle Move (called by Board after each tile movement) =====
	const handleMove = (newBoard) => {
		const newMoves = moves + 1;
		setMoves(newMoves);

		// Auto-save to Firestore after EVERY move (only if signed in and have puzzleData)
		// This ensures progress is never lost (even if user closes tab)
		// Firestore free tier supports this! (~400 daily active users at 50 moves each)
		// In development mode (no user/puzzleData), this is skipped
		if (user && puzzleData) {
			saveGameState(user.uid, puzzleId, difficulty, {
				moves: newMoves,
				board: newBoard,
			}).catch((error) => {
				console.error("Error saving game state:", error);
			});
		}
	};

	// ===== Handle Win (called by Board when puzzle is completed) =====
	const handleWin = () => {
		onWin(); // Notify parent (App) to update trophy badge

		// Save completion to Firestore (only if signed in and have puzzleData):
		// - Adds trophy to completedPuzzles[puzzleId][difficulty]
		// - Updates win streak (if daily puzzle)
		// - Increments totalCompleted
		// - Clears game from gameState (puzzle is done!)
		// In development mode (no user/puzzleData), this is skipped
		if (user && puzzleData) {
			saveCompletion(user.uid, puzzleId, difficulty, {
				moves,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.name,
			}).catch((error) => {
				console.error("Error saving completion:", error);
			});
		}
	};

	const handleSolve = () => {
		if (solveRef.current) {
			solveRef.current();
		}
	};

	const handleRestartClick = () => {
		setShowRestartConfirm(true); // Show confirmation dialog
	};

	const handleRestartConfirm = () => {
		setShowRestartConfirm(false);

		// Reset local state
		setMoves(0);
		const now = Timestamp.now();
		setStartedAt(now);
		setSavedBoard(null); // Clear saved board to force fresh start

		if (onShuffle) {
			onShuffle(); // Reset isGameWon in parent (App)
		}
		if (restartRef.current) {
			restartRef.current(); // Trigger Board's shuffle function
		}

		// Re-start puzzle in Firestore (only if user is signed in and has initialBoard)
		// This creates a fresh gameState entry and updates play streak
		// In development mode (no user), this is skipped - just local restart
		if (user && initialBoard && puzzleData) {
			startPuzzle(user.uid, puzzleId, difficulty, initialBoard).catch(
				(error) => {
					console.error("Error restarting puzzle:", error);
				},
			);
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
						isEarned={highestCompletedDifficulty > 0}
						difficulty={highestCompletedDifficulty || gridSize}
					/>
				</div>
				{!initialBoard ? (
					<div style={{ padding: "20px", textAlign: "center" }}>
						Loading puzzle...
					</div>
				) : (
					<Board
						size={gridSize}
						onWin={handleWin}
						onShowWinDialog={onShowWinDialog}
						hasNumbersShown={hasNumbersShown && !isGameWon}
						onSolveRef={solveRef}
						onRestartRef={restartRef}
						dailyEmoji={dailyEmoji.emoji}
						initialBoard={initialBoard}
						savedBoard={savedBoard}
						onMove={handleMove}
						hasSoundEnabled={hasSoundEnabled}
					/>
				)}

				<div className={styles.restartContainer}>
					<button
						className={`${styles.restartButton} ${styles.visible}`}
						onClick={handleRestartClick}
						title="Restart Puzzle"
					>
						<FontAwesomeIcon icon="redo" />
						Restart
					</button>
					<button
						className={`${styles.restartButton} ${styles.visible}`}
						onClick={handleSolve}
						title="Solve Puzzle (Dev)"
					>
						<FontAwesomeIcon icon="magic" />
						Solve
					</button>
				</div>
			</main>

			<ConfirmResetDialog
				isOpen={showRestartConfirm}
				onClose={() => setShowRestartConfirm(false)}
				onConfirm={handleRestartConfirm}
				message="This will restart the puzzle and reset your current progress. Are you sure?"
			></ConfirmResetDialog>
		</>
	);
}

export default Game;
