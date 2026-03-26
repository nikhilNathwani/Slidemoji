/**
 * useFirestoreMutations - React Query mutations for Firestore game operations (3x3 only)
 *
 * Encapsulates all the React Query mutation boilerplate for saving game data to Firestore.
 * Returns simple wrapper functions that can be called to trigger Firestore saves.
 *
 * Used by: useSaveGame.js (for saves) and useLoadGame.js (for localStorage migration)
 *
 * Returns: { saveStartToFirestore, saveMoveToFirestore, saveCompletionToFirestore }
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
	saveGameStart,
	saveGameMove,
	saveGameCompletion,
} from "../backend/database";
import { addPuzzleSolve } from "../utils/statsHelpers";

export function useFirestoreMutations() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// React Query mutation for starting/restarting puzzles
	const gameStartMutation = useMutation({
		mutationFn: ({ puzzleId, initialGrid, difficulty }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameStart(user.uid, puzzleId, initialGrid, difficulty);
		},
		onError: (error) => {
			console.error("Error starting puzzle:", error);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", user?.uid] });
		},
	});

	// React Query mutation for saving game state after moves
	const gameMoveMutation = useMutation({
		mutationFn: ({ puzzleId, grid, difficulty }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameMove(user.uid, puzzleId, { grid, difficulty });
		},
		onMutate: ({ puzzleId, grid, difficulty }) => {
			// Optimistic update: update cache immediately for instant UI update
			if (user?.uid) {
				queryClient.setQueryData(["user", user.uid], (prevData) => {
					if (!prevData) return prevData;

					// Deep clone to avoid mutations
					const newData = {
						...prevData,
						gameState: {
							...prevData.gameState,
							[puzzleId]: {
								...prevData.gameState?.[puzzleId],
								[difficulty]: grid, // Already in client format (null for gap)
							},
						},
					};
					return newData;
				});
			}
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
			// Could rollback optimistic update here if needed
		},
	});

	// React Query mutation for saving completions
	const gameCompletionMutation = useMutation({
		mutationFn: ({ puzzleId, difficulty }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameCompletion(user.uid, puzzleId, difficulty);
		},
		onMutate: ({ puzzleId, difficulty }) => {
			// Optimistic update: add solve to cache immediately for instant UI update
			if (user?.uid) {
				queryClient.setQueryData(["user", user.uid], (prevData) =>
					addPuzzleSolve(prevData, puzzleId, difficulty),
				);
			}
		},
		onError: (error) => {
			console.error("Error saving completion:", error);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", user?.uid] });
		},
	});

	// Return wrapper functions that trigger the mutations
	return {
		saveStartToFirestore: (data) => gameStartMutation.mutate(data),
		saveMoveToFirestore: (data) => gameMoveMutation.mutate(data),
		saveCompletionToFirestore: (data) =>
			gameCompletionMutation.mutate(data),
	};
}
