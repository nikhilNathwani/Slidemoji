import { useState, useRef, useEffect, useMemo } from "react";
import styles from "./Game.module.css";
import Board from "./Board";
import PuzzleInfo from "./PuzzleInfo";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesomeIcon } from "../../utils/icons";
import {
	useRecordPuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "../../hooks/useGameMutations";
import {
	convertBoardFromFirestore,
	convertPuzzleFromFirestore,
} from "../../utils/puzzleUtils";

/**
 * Game Component - Main puzzle game interface
 *
 * Props:
 * @param {Object} puzzle - Raw puzzle document from Firestore. Game handles format conversion.
 *   Expected structure: { id, date, emoji, emojiName, initialBoard3x3, initialBoard4x4 }
 *   Note: Firestore boards use 0 for gap, converted to null for client
 * @param {number} gridSize - Current difficulty/board size (3 for 3x3, 4 for 4x4)
 * @param {Object} savedGame - Saved game state from Firestore for resume (or null for new game)
 * @param {number} maxGridSizeSolved - Highest difficulty solved for this puzzle (0, 3, or 4)
 */
function Game({
	puzzle: rawPuzzle,
	gridSize,
	savedGame,
	maxGridSizeSolved = 0,
	hasNumbersShown,
	isGameWon,
	hasSoundEnabled,
	onWin,
	onShowWinDialog,
	onShuffle,
}) {
	const { user } = useAuth();
	const [showRestartConfirm, setShowRestartConfirm] = useState(false);
	const [initialBoard, setInitialBoard] = useState(null);
	const [savedBoard, setSavedBoard] = useState(null);
	const solveRef = useRef(null);
	const restartRef = useRef(null);

	// React Query mutations for Firestore writes
	const { mutate: startPuzzle } = useRecordPuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveWin } = useSaveCompletion(user?.uid);

	// Convert puzzle from Firestore format (0 for gap) to client format (null for gap)
	const puzzle = useMemo(() => {
		return rawPuzzle ? convertPuzzleFromFirestore(rawPuzzle) : null;
	}, [rawPuzzle]);

	// ===== Load Initial or Saved Board State =====
	// This effect runs when:
	// - Component mounts
	// - Puzzle changes (new day, or switching puzzle in archive mode)
	// - Difficulty changes (3x3 ↔ 4x4)
	// - User data loads/updates
	useEffect(() => {
		// Wait for puzzle to load before initializing board
		if (!puzzle) {
			return;
		}

		// Get the correct initial board based on difficulty
		const boardKey = gridSize === 3 ? "initialBoard3x3" : "initialBoard4x4";
		const initial = puzzle[boardKey];

		// Defer state updates to avoid cascading renders warning
		Promise.resolve().then(() => {
			if (savedGame) {
				// RESUME MODE: User has a saved game, restore it
				// Convert saved board from Firestore format (0 as gap) to client format (null as gap)
				const convertedBoard = convertBoardFromFirestore(
					savedGame.board,
				);
				setSavedBoard(convertedBoard);
				setInitialBoard(initial); // Keep initial for reference
			} else if (initial) {
				// NEW GAME MODE: Start fresh with initial board
				setInitialBoard(initial);
				setSavedBoard(null);

				// Call recordPuzzleStart to:
				// - Create gameState entry in Firestore
				// - Update play streak (if daily puzzle)
				// - Increment totalAttempted (if first time)
				// Skip in dev mode when no real user is signed in
				if (user) {
					startPuzzle({
						puzzleId: puzzle.id,
						gridSize,
						initialBoard: initial,
					});
				}
			}
		});
	}, [puzzle, savedGame, gridSize, user, startPuzzle]);

	// ===== Handle Move (called by Board after each tile movement) =====
	const handleMove = (newBoard) => {
		// Auto-save to Firestore after EVERY move (only if signed in and have puzzle)
		// This ensures progress is never lost (even if user closes tab)
		// In development mode (no user/puzzle), this is skipped
		if (user && puzzle) {
			saveMove({
				puzzleId: puzzle.id,
				gridSize,
				board: newBoard,
			});
		}
	};

	// ===== Handle Win (called by Board when puzzle is solved) =====
	const handleWin = () => {
		onWin(); // Notify parent (App) to update trophy badge

		// Save solution to Firestore (only if signed in and have puzzle):
		// - Adds trophy to solvedPuzzles[puzzleId][difficulty]
		// - Updates win streak (if daily puzzle)
		// - Increments totalSolved
		// - Clears game from gameState (puzzle is done!)
		// In development mode (no user/puzzle), this is skipped
		if (user && puzzle) {
			saveWin({
				puzzleId: puzzle.id,
				gridSize,
				emoji: puzzle.emoji,
				emojiName: puzzle.emojiName,
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

		// Clear saved board to force fresh start
		setSavedBoard(null);

		if (onShuffle) {
			onShuffle(); // Reset isGameWon in parent (App)
		}
		if (restartRef.current) {
			restartRef.current(); // Trigger Board's shuffle function
		}

		// Re-start puzzle in Firestore (only if user is signed in and has initialBoard)
		// This creates a fresh gameState entry and updates play streak
		// In development mode (no user), this is skipped - just local restart
		if (user && initialBoard && puzzle) {
			startPuzzle({
				puzzleId: puzzle.id,
				gridSize,
				initialBoard,
			});
		}
	};

	// Show loading state while puzzle or board is loading
	if (!puzzle || !initialBoard) {
		return (
			<main className={styles.main}>
				<div style={{ padding: "20px", textAlign: "center" }}>
					Loading puzzle...
				</div>
			</main>
		);
	}

	return (
		<>
			<main className={styles.main}>
				<div className={styles.trophyContainer}>
					<PuzzleInfo
						puzzleNumber={String(puzzle.id).padStart(3, "0")}
						emoji={puzzle.emoji}
						emojiName={puzzle.emojiName}
						maxGridSizeSolved={maxGridSizeSolved}
					/>
				</div>
				<Board
					size={gridSize}
					onWin={handleWin}
					onShowWinDialog={onShowWinDialog}
					hasNumbersShown={hasNumbersShown && !isGameWon}
					onSolveRef={solveRef}
					onRestartRef={restartRef}
					emoji={puzzle.emoji}
					initialBoard={initialBoard}
					savedBoard={savedBoard}
					onMove={handleMove}
					hasSoundEnabled={hasSoundEnabled}
				/>

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

			<ConfirmRestartDialog
				isOpen={showRestartConfirm}
				onClose={() => setShowRestartConfirm(false)}
				onConfirm={handleRestartConfirm}
			></ConfirmRestartDialog>
		</>
	);
}

export default Game;
