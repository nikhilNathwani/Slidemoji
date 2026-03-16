/**
 * useUpdatePreferences - Custom hook for updating user preferences in Firestore
 *
 * Wraps TanStack Query's useMutation to provide optimistic updates and automatic
 * cache synchronization when preferences change.
 *
 * @param {string|null} userId - User ID from Firebase Auth
 * @param {string} userScenario - Dev mode user scenario (for cache key matching)
 * @returns {Object} { updatePreferences, isPending, error }
 *
 * Usage:
 *   const { updatePreferences } = useUpdatePreferences(user?.uid, devConfig.userScenario);
 *   updatePreferences({ darkMode: true });
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserPreferences } from "../backend/database";

export function useUpdatePreferences(userId, userScenario) {
	const queryClient = useQueryClient();

	// Cache key must match useUser's queryKey: ['user', userId]
	const cacheKey = ["user", userId];

	return useMutation({
		// Mutation function - what to call on Firestore
		mutationFn: (preferences) => {
			if (!userId) {
				throw new Error(
					"Cannot update preferences: user not signed in",
				);
			}
			return updateUserPreferences(userId, preferences);
		},

		// Optimistic update - update cache immediately before Firestore confirms
		onMutate: async (newPreferences) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({ queryKey: cacheKey });

			// Snapshot the previous value (for rollback if mutation fails)
			const previousUserData = queryClient.getQueryData(cacheKey);

			// Optimistically update the cache
			queryClient.setQueryData(cacheKey, (old) => ({
				...old,
				preferences: {
					...old?.preferences,
					...newPreferences,
				},
			}));

			// Return context with snapshot for rollback
			return { previousUserData };
		},

		// On error - rollback to previous value
		onError: (error, newPreferences, context) => {
			console.error("Error updating preferences:", error);
			// Restore previous cache value
			if (context?.previousUserData) {
				queryClient.setQueryData(cacheKey, context.previousUserData);
			}
		},

		// On success - don't refetch immediately!
		// The optimistic update is already correct, and immediately refetching
		// can cause race conditions (refetch might get old data before Firestore propagates).
		// Natural refetch will happen:
		// - After staleTime (10 minutes)
		// - On component remount
		// - On window focus (if enabled)
		// This is enough to keep cache in sync.
	});
}
