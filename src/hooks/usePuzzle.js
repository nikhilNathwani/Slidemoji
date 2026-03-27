/**
 * usePuzzle - Custom hook for fetching puzzle data from Firestore
 *
 * Wraps TanStack Query to provide puzzle definition (emoji, initial grids for both difficulties).
 * Automatically caches puzzles (same puzzle used by all users, so caching is great!).
 *
 * @param {number} puzzleId - Puzzle ID to fetch
 * @returns {Object} { data: { id, emoji, emojiName, initialGrids: { normal, hard } }, isLoading, error }
 *
 * Usage:
 *   const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleId);
 */

import { useQuery } from "@tanstack/react-query";
import {
	getPuzzleById,
	convertPuzzleFromFirestore,
} from "../utils/puzzleUtils";

export function usePuzzle(puzzleId) {
	return useQuery({
		// Unique cache key for this puzzle
		queryKey: ["puzzle", puzzleId],

		// Fetch function
		queryFn: async () => {
			try {
				const data = await getPuzzleById(puzzleId);
				if (!data) return null;

				// Convert both grid sizes (fetch once, return both)
				const normalPuzzle = convertPuzzleFromFirestore(data, 3);
				const hardPuzzle = convertPuzzleFromFirestore(data, 4);

				// Return both grids in a unified format
				return {
					id: puzzleId,
					emoji: normalPuzzle.emoji,
					emojiName: normalPuzzle.emojiName,
					initialGrids: {
						normal: normalPuzzle.initialGrid,
						hard: hardPuzzle.initialGrid,
					},
				};
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
