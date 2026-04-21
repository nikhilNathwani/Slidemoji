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
import {
	getFirestorePuzzleById,
	getFirestorePuzzlesByIds,
} from "../services/firestore/puzzle";
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

// Batch-fetches multiple puzzles in a single Firestore 'in' query and populates
// the shared puzzleCache so that usePuzzle calls on the same IDs are instant.
export function usePuzzles(puzzleIds: number[]): {
	data: Map<number, PuzzleData>;
	isLoading: boolean;
} {
	const { isLoading: isAuthLoading } = useAuth();
	// Stable string key avoids array-reference churn in the effect dependency.
	const idsKey = puzzleIds.join(",");

	const [data, setData] = useState<Map<number, PuzzleData>>(() => {
		const map = new Map<number, PuzzleData>();
		for (const id of puzzleIds) {
			const cached = puzzleCache.get(id);
			if (cached) map.set(id, cached);
		}
		return map;
	});
	const [isLoading, setIsLoading] = useState(() =>
		puzzleIds.some((id) => !puzzleCache.has(id)),
	);

	useEffect(() => {
		if (isAuthLoading) return;

		const uncached = puzzleIds.filter((id) => !puzzleCache.has(id));
		if (uncached.length === 0) {
			const map = new Map<number, PuzzleData>();
			for (const id of puzzleIds) {
				const cached = puzzleCache.get(id);
				if (cached) map.set(id, cached);
			}
			setData(map);
			setIsLoading(false);
			return;
		}

		getFirestorePuzzlesByIds(uncached)
			.then((rawMap) => {
				rawMap.forEach((rawPuzzle, id) => {
					const puzzleData: PuzzleData = {
						id,
						emoji: rawPuzzle.emoji,
						emojiName: rawPuzzle.emojiName,
						initialGrids: {
							normal: rawPuzzle.normal,
							hard: rawPuzzle.hard,
						},
					};
					puzzleCache.set(id, puzzleData);
				});
				const map = new Map<number, PuzzleData>();
				for (const id of puzzleIds) {
					const cached = puzzleCache.get(id);
					if (cached) map.set(id, cached);
				}
				setData(map);
				setIsLoading(false);
			})
			.catch((err: unknown) => {
				console.error("[usePuzzles] Error loading puzzles:", err);
				setIsLoading(false);
			});
	}, [idsKey, isAuthLoading]); // eslint-disable-line react-hooks/exhaustive-deps

	return { data, isLoading };
}
// Fire-and-forget cache warm-up for puzzle IDs not yet in the module cache.
// Chunks into batches of 30 (Firestore 'in' query limit) and fires all in parallel.
// Call from a useEffect once auth is settled; errors are swallowed intentionally.
const PREFETCH_BATCH_SIZE = 30;
export async function prefetchPuzzles(puzzleIds: number[]): Promise<void> {
	const uncached = puzzleIds.filter((id) => !puzzleCache.has(id));
	if (uncached.length === 0) return;

	const chunks: number[][] = [];
	for (let i = 0; i < uncached.length; i += PREFETCH_BATCH_SIZE) {
		chunks.push(uncached.slice(i, i + PREFETCH_BATCH_SIZE));
	}

	try {
		const results = await Promise.all(chunks.map(getFirestorePuzzlesByIds));
		results.forEach((rawMap) => {
			rawMap.forEach((rawPuzzle, id) => {
				if (!puzzleCache.has(id)) {
					puzzleCache.set(id, {
						id,
						emoji: rawPuzzle.emoji,
						emojiName: rawPuzzle.emojiName,
						initialGrids: {
							normal: rawPuzzle.normal,
							hard: rawPuzzle.hard,
						},
					});
				}
			});
		});
	} catch (err) {
		console.error("[prefetchPuzzles] Error:", err);
	}
}
