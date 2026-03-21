/**
 * useLoadGame - Hook to load game state on mount (3x3 only)
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
import { GRID_SIZE } from "../constants";

export function useLoadGame({ puzzleId, puzzleData, savedGame }) {
	const { user } = useAuth();
	const { saveStartToFirestore, saveCompletionToFirestore } =
		useFirestoreMutations();

	// Extract primitive values from puzzleData to avoid object reference issues
	const puzzleEmoji = puzzleData.emoji;
	const puzzleEmojiName = puzzleData.emojiName;
	const initialGrid = puzzleData.initialGrid;

	// Compute initial state synchronously (runs on every render but memoized)
	const { loadedGrid, wasSolved, shouldMigrate, shouldSaveStart } =
		useMemo(() => {
			const localCompletion = getLocalCompletion(puzzleId);
			console.log("[useLoadGame] Computing state:", {
				user: user?.uid || "signed-out",
				puzzleId,
				localCompletion,
				hasSavedGame: !!savedGame,
			});

			// Migration: Handle old nested format from before simplification
			// Old: gameState[puzzleId][3].grid, New: gameState[puzzleId].grid
			let actualSavedGame = savedGame;
			if (savedGame && savedGame[3]) {
				console.log("[useLoadGame] Migrating old nested gameState format");
				actualSavedGame = savedGame[3]; // Use 3x3 data from old format
			}

			// Helper: Check if savedGame is just the initial grid (no real progress)
			const isInitialGrid = (grid) => {
				if (!grid) return false;
				return JSON.stringify(grid) === JSON.stringify(initialGrid);
			};

			const hasFirestoreProgress =
				actualSavedGame && !isInitialGrid(actualSavedGame.grid);

			// Priority 1: Firestore saved game with actual progress (signed-in users only)
			if (hasFirestoreProgress) {
				console.log(
					"[useLoadGame] Priority 1: Firestore progress found",
				);
				return {
					loadedGrid: actualSavedGame.grid,
					wasSolved: false,
					shouldMigrate: !!localCompletion?.isCompleted,
					shouldSaveStart: false,
				};
			}

			// Priority 2: localStorage completion (signed-in user with no Firestore progress)
			if (user && localCompletion?.isCompleted) {
				console.log(
					"[useLoadGame] Priority 2: Signed-in user with localStorage completion",
				);
				return {
					loadedGrid: getSolvedState(GRID_SIZE),
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
					loadedGrid: getSolvedState(GRID_SIZE),
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
		}, [user, puzzleId, initialGrid, savedGame]);

	// Handle side effects (Firestore mutations) in useEffect
	useEffect(() => {
		if (shouldMigrate) {
			saveCompletionToFirestore({
				puzzleId,
				emoji: puzzleEmoji,
				emojiName: puzzleEmojiName,
			});
			clearLocalProgress(puzzleId);
			console.log("[GAME] Migrated completion from localStorage");
		}

		if (shouldSaveStart) {
			saveStartToFirestore({
				puzzleId,
				initialGrid,
			});
		}
	}, [
		shouldMigrate,
		shouldSaveStart,
		puzzleId,
		puzzleEmoji,
		puzzleEmojiName,
		initialGrid,
		saveCompletionToFirestore,
		saveStartToFirestore,
	]);

	return { loadedGrid, wasSolved };
}
