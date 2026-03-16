import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./Game.module.css";
import Grid from "./Grid";
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
	convertGridFromFirestore,
	convertPuzzleFromFirestore,
} from "../../utils/puzzleUtils";
import { addPuzzleSolution } from "../../utils/statsHelpers";
import { getSolvedState } from "../../utils/gridHelpers";

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

	// Grid state - Game decides what to show
	const [initialGrid, setInitialGrid] = useState(null);
	const [currentGrid, setCurrentGrid] = useState(null); // null = show initial, otherwise show this
	const [isCompleted, setIsCompleted] = useState(false); // Track if puzzle is completed

	// Track latest grid state in ref (for preserving signed-out progress on sign-in)
	const latestGridRef = useRef(null);

	// Fetch and convert puzzle metadata (emoji, name, initial grids)
	const { data: rawPuzzleData } = usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

	// Firestore mutations
	const { mutate: recordPuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

	// Initialize grid when puzzle/savedGame/gridSize changes
	useEffect(() => {
		if (!puzzleData) return;

		const initial = puzzleData[gridSize];
		if (!initial) return;

		// Don't reset if puzzle is already completed (prevents scrambling after win)
		if (isCompleted) return;

		Promise.resolve().then(() => {
			if (savedGame) {
				// Resume from saved progress
				setCurrentGrid(convertGridFromFirestore(savedGame.grid));
				setInitialGrid(initial);
			} else {
				// Start fresh
				setInitialGrid(initial);
				setCurrentGrid(null); // null means "show initialGrid"

				// Record game start in Firestore
				if (user) {
					recordPuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid: initial,
					});
				}
			}
		});
	}, [puzzleData, savedGame, gridSize, user, recordPuzzleStart, isCompleted]);

	// Reset completion state when puzzle or grid size changes (new puzzle)
	useEffect(() => {
		setIsCompleted(false);
	}, [puzzleId, gridSize]);

	// Handle sign-in and sign-out state transitions
	const prevUserRef = useRef(user);
	useEffect(() => {
		const wasSignedOut = !prevUserRef.current;
		const isNowSignedIn = !!user;
		const wasSignedIn = !!prevUserRef.current;
		const isNowSignedOut = !user;

		// ===== SCENARIO A: Signing in =====
		if (wasSignedOut && isNowSignedIn && puzzleData) {
			// A1: Puzzle completed while signed out - save the trophy
			if (isCompleted) {
				saveCompletion({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				console.log("[GAME] Saved completion after sign-in");
			}
			// A2: In-progress puzzle - preserve signed-out progress if no conflict
			else if (latestGridRef.current && initialGrid) {
				// Check if user already has saved progress for this puzzle
				const currentUserData = queryClient.getQueryData([
					"user",
					user.uid,
				]);
				const existingSavedGame =
					currentUserData?.gameState?.[puzzleData.id]?.[gridSize];

				if (!existingSavedGame) {
					// No existing progress - preserve signed-out work
					recordPuzzleStart({
						puzzleId: puzzleData.id,
						gridSize,
						initialGrid,
					});
					saveMove({
						puzzleId: puzzleData.id,
						gridSize,
						grid: latestGridRef.current,
					});
					console.log("[GAME] Preserved signed-out progress on sign-in");
				} else {
					console.log(
						"[GAME] Existing progress found, keeping signed-in state",
					);
				}
			}
		}

		// ===== SCENARIO B: Signing out =====
		if (wasSignedIn && isNowSignedOut) {
			// Reset to initial grid (teaches that signed-out is ephemeral)
			setCurrentGrid(null);
			setIsCompleted(false);
			latestGridRef.current = null;
			console.log("[GAME] Reset grid on sign-out");
		}

		// Update ref for next render
		prevUserRef.current = user;
	}, [
		user,
		isCompleted,
		puzzleData,
		gridSize,
		initialGrid,
		saveCompletion,
		recordPuzzleStart,
		saveMove,
		queryClient,
	]);

	// Auto-save after each move
	const handleMove = (newGrid) => {
		// Track latest grid state (doesn't cause re-render)
		latestGridRef.current = newGrid;

		if (user && puzzleData) {
			// Signed in: save to Firestore
			saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				grid: newGrid,
			});
		}
	};

	// Handle puzzle completion
	const handleWin = () => {
		// Update currentGrid to solved state to preserve it when signing in
		const solvedGrid = getSolvedState(gridSize);
		setCurrentGrid(solvedGrid);

		setIsCompleted(true); // Mark puzzle as completed to prevent grid reset

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
		setCurrentGrid(null); // Clear current grid to show initial
		setIsCompleted(false); // Reset completion state

		// Record restart in Firestore
		if (user && initialGrid && puzzleData) {
			recordPuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid,
			});
		}
	};

	// Game decides which grid to show (smart logic here)
	const gridToShow = currentGrid || initialGrid;

	// Wait for puzzle data and grid initialization
	if (!puzzleData || !gridToShow) {
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
