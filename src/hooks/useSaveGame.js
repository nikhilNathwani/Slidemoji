/**
 * useSaveGame - Unified hook for game state persistence
 *
 * Handles saving game state (moves, completions, restarts) with automatic routing to:
 * - Firestore (for signed-in users) via React Query mutations
 * - localStorage (for signed-out users)
 *
 * Game.jsx doesn't need to know about storage strategy - it's all encapsulated here.
 *
 * Returns: { saveMove, saveCompletion, saveRestart }
 */

import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";

// Get localStorage key for signed-out progress
const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Save signed-out completion to localStorage (just a flag, no grid state)
const saveCompletionToLocalStorage = (puzzleId, gridSize) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId, gridSize),
		JSON.stringify({ isCompleted: true }),
	);
};

export function useSaveGame() {
	const { user } = useAuth();
	const {
		saveStartToFirestore,
		saveMoveToFirestore,
		saveCompletionToFirestore,
	} = useFirestoreMutations();

	/**
	 * Save game state after a move
	 * Only persists for signed-in users (signed-out users get ephemeral experience)
	 */
	const saveMove = ({ gridSize, grid, puzzleData }) => {
		if (user) {
			// Signed in: save to Firestore
			saveMoveToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				grid,
			});
		}
		// Note: Signed-out users don't persist moves (incentive to sign in)
	};

	/**
	 * Save game completion (win)
	 * Routes to Firestore (signed in) or localStorage flag (signed out)
	 */
	const saveCompletion = ({ puzzleId, gridSize, puzzleData }) => {
		if (user) {
			// Signed in: save to Firestore
			saveCompletionToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
		} else {
			// Signed out: save completion flag only (for trophy display)
			saveCompletionToLocalStorage(puzzleId, gridSize);
		}
	};

	/**
	 * Save game restart
	 * Only persists for signed-in users (signed-out users get ephemeral experience)
	 */
	const saveRestart = ({ gridSize, puzzleData }) => {
		if (user) {
			// Signed in: save to Firestore
			saveStartToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}
		// Note: Signed-out users don't persist restarts
	};

	return {
		saveMove,
		saveCompletion,
		saveRestart,
	};
}
