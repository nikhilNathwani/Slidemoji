import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Board from "./Board";
import Trophy from "../common/Trophy";
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

	// Fetch and convert puzzle metadata (emoji, name, initial boards)
	const { data: rawPuzzleData } = usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

	// Derive initial board from puzzle data (not state, just computed)
	const initialBoard = puzzleData?.[gridSize] ?? null;

	// Derive saved board from savedGame (convert Firestore format)
	const savedBoard = useMemo(() => {
		return savedGame ? convertBoardFromFirestore(savedGame.board) : null;
	}, [savedGame]);

	// Track restart - when toggled, Board will reset to initial state
	const [resetCounter, setResetCounter] = useState(0);

	// Firestore mutations
	const { mutate: recordPuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Record puzzle start when beginning a fresh game (no savedGame)
	useEffect(() => {
		if (!puzzleData || !initialBoard || !user || savedGame) return;

		recordPuzzleStart({
			puzzleId: puzzleData.id,
			gridSize,
			initialBoard,
		});
	}, [puzzleData, initialBoard, user, savedGame, gridSize, recordPuzzleStart]);

	// Auto-save after each move
	const handleMove = (newBoard) => {
		if (user && puzzleData) {
			saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				board: newBoard,
			});
		}
	};

	// Handle puzzle completion
	const handleWin = () => {
		if (user && puzzleData) {
			// Update cache immediately for instant trophy display
			queryClient.setQueryData(["user", user.uid], (prevData) =>
				addPuzzleSolution(prevData, puzzleId, gridSize, {
					completedAt: new Date(),
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				}),
			);

			// Save completion to Firestore
			saveCompletion({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
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
		setResetCounter((prev) => prev + 1); // Signal Board to reset

		// Record restart in Firestore
		if (user && initialBoard && puzzleData) {
			recordPuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialBoard,
			});
		}
	};

	// Wait for puzzle data and board initialization
	if (!puzzleData || !initialBoard) {
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
					<Trophy
						trophyNum={String(puzzleData.id).padStart(3, "0")}
						trophyEmoji={puzzleData.emoji}
						trophyName={puzzleData.emojiName}
						maxGridSizeSolved={maxGridSizeSolved}
					/>
				</div>
				<Board
					resetCounter={resetCounter}
					size={gridSize}
					onWin={handleWin}
					hasNumbersShown={hasNumbersShown && !showWinDialog}
					emoji={puzzleData.emoji}
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
				puzzleData={puzzleData}
				gridSize={gridSize}
			/>
		</>
	);
}

export default Game;
