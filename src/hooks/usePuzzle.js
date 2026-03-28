/**
 * usePuzzle - Fetch puzzle data from Firestore
 *
 * Simple hook for fetching puzzle definition (emoji, initial grids for both difficulties).
 * Firestore offline persistence handles caching automatically.
 *
 * @param {number} puzzleId - Puzzle ID to fetch
 * @returns {Object} { data: { id, emoji, emojiName, initialGrids: { normal, hard } }, isLoading, error }
 *
 * Usage:
 *   const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleId);
 */

import { useState, useEffect } from "react";
import {
	getPuzzleById,
	convertPuzzleFromFirestore,
} from "../utils/puzzleUtils";

export function usePuzzle(puzzleId) {
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!puzzleId) {
			setData(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		getPuzzleById(puzzleId)
			.then((puzzleData) => {
				if (!puzzleData) {
					setData(null);
					setIsLoading(false);
					return;
				}

				// Convert both grid sizes (fetch once, return both)
				const normalPuzzle = convertPuzzleFromFirestore(puzzleData, 3);
				const hardPuzzle = convertPuzzleFromFirestore(puzzleData, 4);

				// Return both grids in a unified format
				setData({
					id: puzzleId,
					emoji: normalPuzzle.emoji,
					emojiName: normalPuzzle.emojiName,
					initialGrids: {
						normal: normalPuzzle.initialGrid,
						hard: hardPuzzle.initialGrid,
					},
				});
				setIsLoading(false);
			})
			.catch((err) => {
				console.error("[usePuzzle] Error loading puzzle:", err);
				setError(err);
				setIsLoading(false);
			});
	}, [puzzleId]);

	return { data, isLoading, error };
}
