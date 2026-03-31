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

import { useMemo, useCallback } from "react";
import {
	saveFirestoreGameState,
	deleteAnonymousPastGameState,
} from "../firebase/firestore/gameState";
import { DIFFICULTY, DEFAULT_DIFFICULTY } from "../constants";
import { useAuth } from "../contexts/auth";
import { useUserDoc } from "../contexts/userDoc";

import { chooseGridForMerge } from "../utils/gridHelpers";

function composeGameState(preferredState, alternateState, initialGrids) {
	if (!initialGrids) {
		return preferredState || alternateState || null;
	}

	const normal = chooseGridForMerge(
		alternateState?.normal,
		preferredState?.normal,
		initialGrids.normal,
	);
	const hard = chooseGridForMerge(
		alternateState?.hard,
		preferredState?.hard,
		initialGrids.hard,
	);

	return {
		normal: normal || initialGrids.normal,
		hard: hard || initialGrids.hard,
		currentDifficulty:
			preferredState?.currentDifficulty ||
			alternateState?.currentDifficulty ||
			DEFAULT_DIFFICULTY,
	};
}

export function useGameState({ puzzleMetadata }) {
	const puzzleId = puzzleMetadata?.id;
	const {
		user,
		isMerging,
		mergeSnapshotGameState,
		preferInitialAnonymousState,
	} = useAuth();
	const { userData, loading: userDocLoading } = useUserDoc();
	const userId = user?.uid || null;
	const isAnonymous = user?.isAnonymous === true;

	const persistedGameState = useMemo(() => {
		if (!puzzleMetadata?.initialGrids) {
			return null;
		}

		if (!userId) {
			return preferInitialAnonymousState
				? {
						normal: puzzleMetadata.initialGrids.normal,
						hard: puzzleMetadata.initialGrids.hard,
						currentDifficulty: DEFAULT_DIFFICULTY,
					}
				: null;
		}

		const savedGameState = userData?.gameState?.[puzzleId] || null;
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
	}, [
		userId,
		puzzleMetadata,
		userData,
		puzzleId,
		preferInitialAnonymousState,
	]);

	const gameState = useMemo(() => {
		const activeMergePuzzleState = isMerging
			? mergeSnapshotGameState?.[puzzleId]
			: null;

		return activeMergePuzzleState
			? composeGameState(
					persistedGameState,
					activeMergePuzzleState,
					puzzleMetadata?.initialGrids,
				)
			: persistedGameState;
	}, [
		isMerging,
		mergeSnapshotGameState,
		puzzleId,
		persistedGameState,
		puzzleMetadata,
	]);

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
						await deleteAnonymousPastGameState(userId, puzzleId);
					}
				}
			} catch (error) {
				console.error("[useGameState] Error saving game state:", error);
				throw error;
			}
		},
		[userId, isAnonymous, gameState, puzzleMetadata, puzzleId],
	);

	const loading = preferInitialAnonymousState
		? false
		: !userId || userDocLoading;

	return [gameState, setGameState, loading];
}
