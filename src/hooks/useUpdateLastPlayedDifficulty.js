/**
 * useUpdateLastPlayedDifficulty - Custom hook for updating lastPlayedDifficulty in Firestore
 *
 * Wraps TanStack Query's useMutation to provide optimistic updates and automatic
 * cache synchronization when user manually changes difficulty in settings.
 *
 * @param {string|null} userId - User ID from Firebase Auth
 * @returns {Object} { updateLastPlayedDifficulty, isPending, error }
 *
 * Usage:
 *   const { mutate: updateLastPlayedDifficulty } = useUpdateLastPlayedDifficulty(user?.uid);
 *   updateLastPlayedDifficulty(4);
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLastPlayedDifficulty } from "../backend/database";

export function useUpdateLastPlayedDifficulty(userId) {
	const queryClient = useQueryClient();

	// Cache key must match useUser's queryKey: ['user', userId]
	const cacheKey = ["user", userId];

	return useMutation({
		// Mutation function - what to call on Firestore
		mutationFn: (difficulty) => {
			if (!userId) {
				throw new Error("Cannot update difficulty: user not signed in");
			}
			return updateLastPlayedDifficulty(userId, difficulty);
		},

		// Optimistic update - update cache immediately before Firestore confirms
		onMutate: async (newDifficulty) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({ queryKey: cacheKey });

			// Snapshot the previous value (for rollback if mutation fails)
			const previousUserData = queryClient.getQueryData(cacheKey);

			// Optimistically update the cache
			queryClient.setQueryData(cacheKey, (old) => ({
				...old,
				lastPlayedDifficulty: newDifficulty,
			}));

			// Return context with snapshot for rollback
			return { previousUserData };
		},

		// On error - rollback to previous value
		onError: (error, newDifficulty, context) => {
			console.error("Error updating last played difficulty:", error);
			// Restore previous cache value
			if (context?.previousUserData) {
				queryClient.setQueryData(cacheKey, context.previousUserData);
			}
		},

		// On success - invalidate to refetch and ensure sync
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: cacheKey });
		},
	});
}
