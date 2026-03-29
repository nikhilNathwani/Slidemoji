/**
 * usePuzzle - Fetch puzzle data from Firestore
 *
 * Simple hook for fetching puzzle definition (emoji, initial grids for both difficulties, 0-gap).
 * Firestore offline persistence handles caching automatically.
 *
 * @param {number} puzzleId - Puzzle ID to fetch
 * @returns {Object} { data: { id, emoji, emojiName, initialGrids: { normal, hard } }, isLoading, error }
 *
 * Usage:
 *   const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleId);
 */

import { useState, useEffect } from "react";
import { convertPuzzleFromFirestore } from "../utils/puzzleUtils";
import { getFirestorePuzzleById } from "../firebase/firestore/puzzle";

export function usePuzzle(puzzleId) {
	const [state, setState] = useState({
		puzzleId: null,
		data: null,
		error: null,
	});

	useEffect(() => {
		if (!puzzleId) {
			return;
		}

		getFirestorePuzzleById(puzzleId)
			.then((puzzleData) => {
				if (!puzzleData) {
					setState({
						puzzleId,
						data: null,
						error: null,
					});
					return;
				}

				// Convert both grid sizes (fetch once, return both)
				const normalPuzzle = convertPuzzleFromFirestore(puzzleData, 3);
				const hardPuzzle = convertPuzzleFromFirestore(puzzleData, 4);

				// Return both grids in a unified format
				setState({
					puzzleId,
					data: {
						id: puzzleId,
						emoji: normalPuzzle.emoji,
						emojiName: normalPuzzle.emojiName,
						initialGrids: {
							normal: normalPuzzle.initialGrid,
							hard: hardPuzzle.initialGrid,
						},
					},
					error: null,
				});
			})
			.catch((err) => {
				console.error("[usePuzzle] Error loading puzzle:", err);
				setState({
					puzzleId,
					data: null,
					error: err,
				});
			});
	}, [puzzleId]);

	if (!puzzleId) {
		return { data: null, isLoading: false, error: null };
	}

	if (state.puzzleId !== puzzleId) {
		return { data: null, isLoading: true, error: null };
	}

	return { data: state.data, isLoading: false, error: state.error };
}
