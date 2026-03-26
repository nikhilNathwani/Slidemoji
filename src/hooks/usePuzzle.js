/**
 * usePuzzle - Custom hook for fetching puzzle data from Firestore
 *
 * Wraps TanStack Query to provide puzzle definition (emoji, initial grids).
 * Automatically caches puzzles (same puzzle used by all users, so caching is great!).
 *
 * @param {number} puzzleId - Puzzle ID to fetch
 * @param {number} gridSize - Grid size to load (3 or 4)
 * @returns {Object} { puzzle, isLoading, error }
 *
 * Usage:
 *   const { puzzle, isLoading } = usePuzzle(puzzleId, gridSize);
 */

import { useQuery } from "@tanstack/react-query";
import {
	getPuzzleById,
	convertPuzzleFromFirestore,
} from "../utils/puzzleUtils";

export function usePuzzle(puzzleId, gridSize = 3) {
	return useQuery({
		// Unique cache key for this puzzle and grid size
		queryKey: ["puzzle", puzzleId, gridSize],

		// Fetch function
		queryFn: async () => {
			// Fetch from Firestore
			try {
				const data = await getPuzzleById(puzzleId);
				// Convert Firestore format (0 for gap) to client format (null for gap)
				return convertPuzzleFromFirestore(data, gridSize);
			} catch (error) {
				console.error("Error loading puzzle:", error);
				throw error; // Let React Query handle retry logic
			}
		},

		// Only fetch if we have a valid puzzle ID
		enabled: !!puzzleId,

		// Cache puzzle for 24 hours (puzzles never change once published)
		staleTime: 24 * 60 * 60 * 1000,
	});
}
