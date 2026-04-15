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
import { useAuth } from "../auth/useAuth";

interface PuzzleState {
	puzzleId: number | null;
	data: PuzzleData | null;
	error: Error | null;
}

// Module-level cache: survives re-renders and component remounts within the session.
// Trophy components remount on TrophyCase page navigation, so without this cache
// every page turn would briefly show blank trophies while Firestore responds.
const puzzleCache = new Map<number, PuzzleData>();

export function usePuzzle(puzzleId: number | null): {
	data: PuzzleData | null;
	isLoading: boolean;
	error: Error | null;
} {
	const { isLoading: isAuthLoading } = useAuth();
	// Lazy initializer: if this puzzleId is already cached, initialize with the
	// cached data so the very first render has the correct state (no flash).
	const [state, setState] = useState<PuzzleState>(() => {
		if (puzzleId === null)
			return { puzzleId: null, data: null, error: null };
		const cached = puzzleCache.get(puzzleId) ?? null;
		return {
			puzzleId: cached ? puzzleId : null,
			data: cached,
			error: null,
		};
	});

	useEffect(() => {
		// Firestore puzzle reads require an authenticated user.
		// Wait for Firebase Auth to settle before making any request.
		// Without this, first-time visitors get a permission-denied error
		// (anonymous sign-in hasn't completed yet), leaving the app stuck on "Loading...".
		if (isAuthLoading) return;
		if (!puzzleId) return;

		// Cache hit: update state if needed (e.g. puzzleId changed on same component
		// instance) and skip the Firestore fetch.
		const cached = puzzleCache.get(puzzleId);
		if (cached) {
			setState({ puzzleId, data: cached, error: null });
			return;
		}

		getFirestorePuzzleById(puzzleId)
			.then((rawData) => {
				// Type assertion at the Firestore boundary: we know the document
				// shape matches FirestorePuzzle based on our data pipeline.
				const puzzleData = rawData as FirestorePuzzle | null;
				if (!puzzleData) {
					setState({ puzzleId, data: null, error: null });
					return;
				}

				const data: PuzzleData = {
					id: puzzleId,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
					initialGrids: {
						normal: puzzleData.normal,
						hard: puzzleData.hard,
					},
				};
				puzzleCache.set(puzzleId, data);
				setState({ puzzleId, data, error: null });
			})
			.catch((err: unknown) => {
				console.error("[usePuzzle] Error loading puzzle:", err);
				setState({ puzzleId, data: null, error: err as Error });
			});
	}, [puzzleId, isAuthLoading]);

	if (!puzzleId) return { data: null, isLoading: false, error: null };
	if (state.puzzleId !== puzzleId)
		return { data: null, isLoading: true, error: null };
	return { data: state.data, isLoading: false, error: state.error };
}
