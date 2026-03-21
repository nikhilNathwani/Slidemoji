/**
 * useSaveGame - Unified hook for game state persistence (3x3 only)
 *
 * Handles saving game state (moves, solves, restarts) with automatic routing to:
 * - Firestore (for signed-in users) via React Query mutations
 * - localStorage (for signed-out users)
 *
 * Game.jsx doesn't need to know about storage strategy - it's all encapsulated here.
 *
 * Returns: { saveMove, saveSolve, saveRestart }
 */

import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";
import { saveLocalCompletion } from "../utils/localStorage";

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
	const saveMove = ({ grid, puzzleMetadata }) => {
		if (user) {
			// Signed in: save to Firestore
			saveMoveToFirestore({
				puzzleId: puzzleMetadata.id,
				grid,
			});
		}
		// Note: Signed-out users don't persist moves (incentive to sign in)
	};

	/**
	 * Save puzzle solve (when completed)
	 * Routes to Firestore (signed in) or localStorage flag (signed out)
	 */
	const saveSolve = ({ puzzleMetadata }) => {
		if (user) {
			// Signed in: save to Firestore
			saveCompletionToFirestore({
				puzzleId: puzzleMetadata.id,
				emoji: puzzleMetadata.emoji,
				emojiName: puzzleMetadata.emojiName,
			});
		} else {
			// Signed out: save completion flag only (for trophy display)
			saveLocalCompletion(puzzleMetadata.id);
		}
	};

	/**
	 * Save game restart
	 * Only persists for signed-in users (signed-out users get ephemeral experience)
	 */
	const saveRestart = ({ puzzleMetadata }) => {
		if (user) {
			// Signed in: save to Firestore
			saveStartToFirestore({
				puzzleId: puzzleMetadata.id,
				initialGrid: puzzleMetadata.initialGrid,
			});
		}
		// Note: Signed-out users don't persist restarts
	};

	return {
		saveMove,
		saveSolve,
		saveRestart,
	};
}
