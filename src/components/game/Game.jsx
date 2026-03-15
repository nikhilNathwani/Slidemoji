import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Board from "./Board";
import PuzzleInfo from "./PuzzleInfo";
import ConfirmRestartDialog from "../dialogs/ConfirmRestartDialog";
import WinDialog from "../dialogs/WinDialog";
import { useAuth } from "../../hooks/useAuth";
import { usePuzzle } from "../../hooks/usePuzzle";
import { FontAwesomeIcon } from "../../utils/icons";
import {
	useSavePuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "../../hooks/useGameMutations";
import {
	convertBoardFromFirestore,
	convertPuzzleFromFirestore,
} from "../../utils/puzzleUtils";
import { addPuzzleSolution } from "../../utils/statsHelpers";

function Game({
	puzzleId,
	gridSize,
	savedGame,
	maxGridSizeSolved = 0,
	hasNumbersShown,
	hasSoundEnabled,
}) {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// Dialog state
	const [showRestartDialog, setShowRestartDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);

	// Board state
	const [initialBoard, setInitialBoard] = useState(null);
	const [savedBoard, setSavedBoard] = useState(null);

	// Fetch and convert puzzle data
	const { data: rawPuzzle } = usePuzzle(puzzleId);
	const puzzle = useMemo(() => {
		return rawPuzzle ? convertPuzzleFromFirestore(rawPuzzle) : null;
	}, [rawPuzzle]);

	// Firestore mutations
	const { mutate: startPuzzle } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveWin } = useSaveCompletion(user?.uid);

	// Initialize board state when puzzle/savedGame/gridSize changes
	useEffect(() => {
		if (!puzzle) return;

		const boardKey = gridSize === 3 ? "initialBoard3x3" : "initialBoard4x4";
		const initial = puzzle[boardKey];

		if (savedGame) {
			// Resume saved game
			const convertedBoard = convertBoardFromFirestore(savedGame.board);
			setSavedBoard(convertedBoard);
			setInitialBoard(initial);
		} else if (initial) {
			// Start new game
			setInitialBoard(initial);
			setSavedBoard(null);

			// Record game start in Firestore
			if (user) {
				startPuzzle({
					puzzleId: puzzle.id,
					gridSize,
					initialBoard: initial,
				});
			}
		}
	}, [puzzle, savedGame, gridSize, user, startPuzzle]);

	// Auto-save after each move
	const handleMove = (newBoard) => {
		if (user && puzzle) {
			saveMove({
				puzzleId: puzzle.id,
				gridSize,
				board: newBoard,
			});
		}
	};

	// Handle puzzle completion
	const handleWin = () => {
		if (user && puzzle) {
			// Update cache immediately for instant trophy display
			queryClient.setQueryData(["user", user.uid], (prevData) =>
				addPuzzleSolution(prevData, puzzleId, gridSize, {
					completedAt: new Date(),
					emoji: puzzle.emoji,
					emojiName: puzzle.emojiName,
				}),
			);

			// Save to Firestore
			saveWin({
				puzzleId: puzzle.id,
				gridSize,
				emoji: puzzle.emoji,
				emojiName: puzzle.emojiName,
			});
		}

		setShowWinDialog(true);
	};

	// Handle restart
	const handleRestartClick = () => {
		setShowRestartDialog(true);
	};

	const handleRestartConfirm = () => {
		setShowRestartDialog(false);
		setSavedBoard(null); // Reset to initial board

		// Record restart in Firestore
		if (user && initialBoard && puzzle) {
			startPuzzle({
				puzzleId: puzzle.id,
				gridSize,
				initialBoard,
			});
		}
	};

	// Wait for puzzle data and board initialization
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
					hasNumbersShown={hasNumbersShown && !showWinDialog}
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
				puzzle={puzzle}
				gridSize={gridSize}
			/>
		</>
	);
}

export default Game;
