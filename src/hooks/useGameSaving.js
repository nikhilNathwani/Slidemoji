/**
 * useGameSaving - Unified hook for game state persistence
 *
 * Handles saving game progress, completions, and restarts.
 * Automatically routes to:
 * - Firestore (for signed-in users)
 * - localStorage (for signed-out users)
 *
 * Game.jsx doesn't need to know about storage strategy - it's all encapsulated here.
 *
 * Returns: { saveProgress, saveCompletion, saveRestart }
 */

import { useAuth } from "./useAuth";
import {
	useSavePuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "./useGameMutations";

// Get localStorage key for signed-out progress
const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Save signed-out progress to localStorage
const saveToLocalStorage = (
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	isCompleted,
) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId, gridSize),
		JSON.stringify({
			isCompleted,
			grid,
			initialGrid: puzzleData[gridSize],
		}),
	);
};

export function useGameSaving() {
	const { user } = useAuth();

	// Get Firestore mutation functions
	const { mutate: savePuzzleStartToFirestore } = useSavePuzzleStart(
		user?.uid,
	);
	const { mutate: saveStateToFirestore } = useSaveGameState(user?.uid);
	const { mutate: saveCompletionToFirestore } = useSaveCompletion(user?.uid);

	/**
	 * Save game progress after a move
	 * Routes to Firestore (signed in) or localStorage (signed out)
	 */
	const saveProgress = ({ puzzleId, gridSize, grid, puzzleData }) => {
		if (user) {
			// Signed in: save to Firestore
			saveStateToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				grid,
			});
		} else {
			// Signed out: save to localStorage
			saveToLocalStorage(puzzleId, gridSize, grid, puzzleData, false);
		}
	};

	/**
	 * Save game completion (win)
	 * Routes to Firestore (signed in) or localStorage (signed out)
	 */
	const saveCompletion = ({
		puzzleId,
		gridSize,
		grid,
		puzzleData,
		updateCacheImmediately,
	}) => {
		if (user) {
			// Signed in: save to Firestore
			updateCacheImmediately?.();
			saveCompletionToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
		} else {
			// Signed out: save to localStorage
			saveToLocalStorage(puzzleId, gridSize, grid, puzzleData, true);
		}
	};

	/**
	 * Save game restart
	 * Only persists for signed-in users (signed-out users get ephemeral experience)
	 */
	const saveRestart = ({ gridSize, puzzleData }) => {
		if (user) {
			savePuzzleStartToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}
		// Note: Signed-out users don't persist restarts
	};

	return {
		saveProgress,
		saveCompletion,
		saveRestart,
	};
}
