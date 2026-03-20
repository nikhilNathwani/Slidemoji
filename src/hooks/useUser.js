/**
 * useUser - Custom hook for fetching user data from Firestore
 *
 * Wraps TanStack Query to provide user preferences, stats, and game state.
 * Automatically caches and refetches when needed.
 *
 * @param {string|null} userId - User ID from Firebase Auth, or null if not signed in
 * @returns {Object} { userData, isLoading, error }
 *
 * Usage:
 *   const { userData, isLoading } = useUser(user?.uid);
 */

import { useQuery } from "@tanstack/react-query";
import { getUserData } from "../backend/database";
import { convertGridFromFirestore } from "../utils/puzzleUtils";

export function useUser(userId) {
	return useQuery({
		// Unique cache key for this user's data
		queryKey: ["user", userId],

		// Fetch function
		queryFn: async () => {
			// If no user, return empty object (anonymous play)
			if (!userId) {
				return {};
			}

			// Fetch from Firestore
			try {
				const data = await getUserData(userId);

				// Convert saved game grids from Firestore format (0 for gap) to client format (null for gap)
				if (data?.gameState) {
					for (const puzzleId in data.gameState) {
						for (const difficulty in data.gameState[puzzleId]) {
							const savedGame =
								data.gameState[puzzleId][difficulty];
							if (savedGame?.grid) {
								savedGame.grid = convertGridFromFirestore(
									savedGame.grid,
								);
							}
						}
					}
				}

				return data;
			} catch (error) {
				console.error("[AUTH] Error loading user data:", error);
				console.error("[AUTH] Error details:", {
					message: error.message,
					code: error.code,
					stack: error.stack,
				});
				// Return empty object so grid doesn't stay stuck on "Loading..."
				return {};
			}
		},

		// Always enabled (even for anonymous users, we return {})
		enabled: true,

		// Cache user data for 10 minutes (rarely changes)
		staleTime: 10 * 60 * 1000,
	});
}
