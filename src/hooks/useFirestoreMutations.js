/**
 * useFirestoreMutations - React Query mutations for Firestore game operations
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

export function useFirestoreMutations() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// React Query mutation for starting/restarting puzzles
	const gameStartMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, initialGrid }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameStart(user.uid, puzzleId, gridSize, initialGrid);
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
		mutationFn: ({ puzzleId, gridSize, grid }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameMove(user.uid, puzzleId, gridSize, { grid });
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
		},
		// No cache invalidation - grid state is local only
	});

	// React Query mutation for saving completions
	const gameCompletionMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, emoji, emojiName }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameCompletion(user.uid, puzzleId, gridSize, {
				emoji,
				emojiName,
			});
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
