/**
 * useLoadGame - Hook to load game state on mount
 *
 * Handles:
 * - Loading saved game from Firestore or localStorage
 * - Migrating localStorage progress when signing in
 * - Determining initial grid state
 * - Starting fresh games
 *
 * Returns: { loadedGrid, wasSolved }
 * - loadedGrid: Grid state to render (null = show fresh puzzle, array = resume/solved state)
 * - wasSolved: Whether this puzzle was already completed
 */

import { useEffect, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";
import { getLocalCompletion, clearLocalProgress } from "../utils/localStorage";
import { getSolvedState } from "../utils/gridHelpers";

export function useLoadGame({ puzzleId, gridSize, puzzleData, savedGame }) {
	const { user } = useAuth();
	const { saveStartToFirestore, saveCompletionToFirestore } =
		useFirestoreMutations();

	// Compute initial state synchronously (runs on every render but memoized)
	const { loadedGrid, wasSolved, shouldMigrate, shouldSaveStart } = useMemo(() => {
		const localCompletion = getLocalCompletion(puzzleId, gridSize);
		console.log("[useLoadGame] Computing state:", {
			user: user?.uid || "signed-out",
			puzzleId,
			gridSize,
			localCompletion,
			hasSavedGame: !!savedGame,
		});

		// Helper: Check if savedGame is just the initial grid (no real progress)
		const isInitialGrid = (grid) => {
			if (!grid) return false;
			const initial = puzzleData[gridSize];
			return JSON.stringify(grid) === JSON.stringify(initial);
		};

		const hasFirestoreProgress =
			savedGame && !isInitialGrid(savedGame.grid);

		// Priority 1: Firestore saved game with actual progress (signed-in users only)
		if (hasFirestoreProgress) {
			console.log("[useLoadGame] Priority 1: Firestore progress found");
			return {
				loadedGrid: savedGame.grid,
				wasSolved: false,
				shouldMigrate: !!localCompletion?.isCompleted,
				shouldSaveStart: false,
			};
		}

		// Priority 2: localStorage completion (signed-in user with no Firestore progress)
		if (user && localCompletion?.isCompleted) {
			console.log("[useLoadGame] Priority 2: Signed-in user with localStorage completion");
			return {
				loadedGrid: getSolvedState(gridSize),
				wasSolved: true,
				shouldMigrate: true,
				shouldSaveStart: false,
			};
		}

		// Priority 3: Check localStorage for signed-out user completions
		// (Trophies persist even when signed out, but not in-progress games)
		if (!user && localCompletion?.isCompleted) {
			console.log(
				"[useLoadGame] Priority 3: Signed-out completion found",
			);
			return {
				loadedGrid: getSolvedState(gridSize),
				wasSolved: true,
				shouldMigrate: false,
				shouldSaveStart: false,
			};
		}

		// Signed-in user starting fresh
		if (user) {
			console.log("[useLoadGame] Signed-in user starting fresh");
			return {
				loadedGrid: null,
				wasSolved: false,
				shouldMigrate: false,
				shouldSaveStart: true,
			};
		}

		// Default: Signed-out user with no completion
		console.log("[useLoadGame] Default: Signed-out starting fresh");
		return {
			loadedGrid: null,
			wasSolved: false,
			shouldMigrate: false,
			shouldSaveStart: false,
		};
	}, [user, puzzleId, gridSize, puzzleData, savedGame]);

	// Handle side effects (Firestore mutations) in useEffect
	useEffect(() => {
		if (shouldMigrate) {
			saveCompletionToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
			clearLocalProgress(puzzleId, gridSize);
			console.log("[GAME] Migrated completion from localStorage");
		}

		if (shouldSaveStart) {
			saveStartToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}
	}, [
		shouldMigrate,
		shouldSaveStart,
		puzzleId,
		gridSize,
		puzzleData,
		saveCompletionToFirestore,
		saveStartToFirestore,
	]);

	return { loadedGrid, wasSolved };
}
