/**
 * useGameState - Unified hook for game state loading and saving
 *
 * Uses shared user-doc context for real-time updates.
 * Everyone uses Firestore (anonymous or Google via Firebase Anonymous Auth).
 *
 * const [gameState, setGameState] = useGameState({ puzzleMetadata })
 *
 * Returns:
 * - gameState: { normal: grid, hard: grid, currentDifficulty }
 * - setGameState: ({ currentDifficulty?, normal?, hard? }) => void
 *
 * This hook:
 * - Reads from UserDocProvider's single Firestore onSnapshot stream
 * - Automatic offline support via Firestore IndexedDB persistence
 * - No caching layer needed - Firestore SDK handles everything
 * - Eliminates dual storage and if(user) branching
 */

import { useMemo, useCallback, useEffect } from "react";
import {
	saveFirestoreGameState,
	trimGameHistory,
} from "../services/firestore/gameState";
import { DIFFICULTY, DEFAULT_DIFFICULTY } from "../constants";
import { useAuth } from "./useAuth";
import { useUserDoc } from "./useUserDoc";

export function useGameState({ puzzleMetadata }) {
	const puzzleId = puzzleMetadata?.id;
	const {
		user,
		isMerging,
		anonymousSnapshot,
		onMergeSettled,
		preferInitialGrid,
	} = useAuth();
	const { userDoc, isLoading: userDocLoading } = useUserDoc();
	const userId = user?.uid || null;
	const isAnonymous = user?.isAnonymous === true;

	const firestoreGameState = useMemo(() => {
		if (!puzzleMetadata?.initialGrids) {
			return null;
		}

		if (!userId) {
			return preferInitialGrid
				? {
						normal: puzzleMetadata.initialGrids.normal,
						hard: puzzleMetadata.initialGrids.hard,
						currentDifficulty: DEFAULT_DIFFICULTY,
					}
				: null;
		}

		const savedGameState = userDoc?.gameState?.[puzzleId] || null;
		if (!savedGameState) {
			return {
				normal: puzzleMetadata.initialGrids.normal,
				hard: puzzleMetadata.initialGrids.hard,
				currentDifficulty: DEFAULT_DIFFICULTY,
			};
		}

		const getSavedGrid = (diff) => {
			const grid = savedGameState?.[diff];
			if (!grid || !Array.isArray(grid)) return null;
			return grid;
		};

		const currentDifficulty =
			savedGameState?.currentDifficulty || DEFAULT_DIFFICULTY;

		return {
			normal:
				getSavedGrid(DIFFICULTY.NORMAL) ||
				puzzleMetadata.initialGrids.normal,
			hard:
				getSavedGrid(DIFFICULTY.HARD) ||
				puzzleMetadata.initialGrids.hard,
			currentDifficulty,
		};
	}, [userId, puzzleMetadata, userDoc, puzzleId, preferInitialGrid]);

	const gameState = useMemo(
		() => anonymousSnapshot?.[puzzleId] ?? firestoreGameState,
		[anonymousSnapshot, puzzleId, firestoreGameState],
	);

	// Once isMerging is done and anonymousSnapshot is still set, wait for
	// Firestore to deliver today's puzzle data then clear the snapshot.
	// The merge write commits before SIGN_IN_SUCCESS (isMerging→false), so
	// the first onSnapshot for the Google doc always includes the merged data.
	useEffect(() => {
		if (isMerging || !anonymousSnapshot) return;
		if (userDoc?.gameState?.[puzzleId]) {
			onMergeSettled();
		}
	}, [isMerging, anonymousSnapshot, userDoc, puzzleId, onMergeSettled]);

	// Setter that saves to Firestore via the shared firestore module
	const setGameState = useCallback(
		async ({ currentDifficulty, normal, hard }) => {
			if (!userId || !puzzleMetadata?.initialGrids || !gameState) return;

			try {
				const hasNormalUpdate = Array.isArray(normal);
				const hasHardUpdate = Array.isArray(hard);

				if (currentDifficulty && !hasNormalUpdate && !hasHardUpdate) {
					// Difficulty switch: only persist the selected difficulty.
					await saveFirestoreGameState(userId, puzzleId, {
						currentDifficulty,
					});
					return;
				}

				if (hasNormalUpdate || hasHardUpdate) {
					// Grid update (move made or restart)
					const nextDifficulty =
						currentDifficulty || gameState.currentDifficulty;
					await saveFirestoreGameState(userId, puzzleId, {
						currentDifficulty: nextDifficulty,
						normal,
						hard,
					});

					// Clean up old trophies for anonymous users (only keep today's puzzle)
					if (isAnonymous) {
						await trimGameHistory(
							userId,
							puzzleId,
							userDoc?.gameState ?? null,
						);
					}
				}
			} catch (error) {
				console.error("[useGameState] Error saving game state:", error);
				throw error;
			}
		},
		[userId, isAnonymous, gameState, puzzleMetadata, puzzleId, userDoc],
	);

	const loading = preferInitialGrid ? false : !userId || userDocLoading;

	return [gameState, setGameState, loading];
}
