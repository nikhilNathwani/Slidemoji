/**
 * usePuzzle - Fetch puzzle data from Firestore
 *
 * Fetches both grid sizes in a single document read and returns them in a
 * unified format. Firestore offline persistence handles caching automatically.
 *
 * @returns { data: PuzzleData | null, isLoading: boolean, error: Error | null }
 */

import { useState, useEffect } from "react";
import type { FirestorePuzzle, PuzzleData } from "../utils/puzzleUtils";
import { getFirestorePuzzleById } from "../services/firestore/puzzle";

interface PuzzleState {
	puzzleId: number | null;
	data: PuzzleData | null;
	error: Error | null;
}

export function usePuzzle(puzzleId: number | null): {
	data: PuzzleData | null;
	isLoading: boolean;
	error: Error | null;
} {
	const [state, setState] = useState<PuzzleState>({
		puzzleId: null,
		data: null,
		error: null,
	});

	useEffect(() => {
		if (!puzzleId) return;

		getFirestorePuzzleById(puzzleId)
			.then((rawData) => {
				// Type assertion at the Firestore boundary: we know the document
				// shape matches FirestorePuzzle based on our data pipeline.
				const puzzleData = rawData as FirestorePuzzle | null;
				if (!puzzleData) {
					setState({ puzzleId, data: null, error: null });
					return;
				}

				setState({
					puzzleId,
					data: {
						id: puzzleId,
						emoji: puzzleData.emoji,
						emojiName: puzzleData.emojiName,
						initialGrids: {
							normal: puzzleData.normal,
							hard: puzzleData.hard,
						},
					},
					error: null,
				});
			})
			.catch((err: unknown) => {
				console.error("[usePuzzle] Error loading puzzle:", err);
				setState({ puzzleId, data: null, error: err as Error });
			});
	}, [puzzleId]);

	if (!puzzleId) return { data: null, isLoading: false, error: null };
	if (state.puzzleId !== puzzleId)
		return { data: null, isLoading: true, error: null };
	return { data: state.data, isLoading: false, error: state.error };
}
