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
import { convertGridFromFirestore } from "../utils/puzzleUtils";
import { GRID_SIZE } from "../constants";

export function useLoadGame({
	puzzleId,
	puzzleMetadata,
	savedGame,
	solvedPuzzles,
}) {
	const { user } = useAuth();
	const { saveStartToFirestore, saveCompletionToFirestore } =
		useFirestoreMutations();

	// Extract primitive values from puzzleMetadata to avoid object reference issues
	const puzzleEmoji = puzzleMetadata.emoji;
	const puzzleEmojiName = puzzleMetadata.emojiName;
	const initialGrid = puzzleMetadata.initialGrid;

	// Compute initial state synchronously (runs on every render but memoized)
	const { loadedGrid, wasSolved, shouldMigrate } = useMemo(() => {
		// Check all data sources
		const localCompletion = getLocalCompletion(puzzleId); // localStorage completion flag
		const hasSignedInSolve = solvedPuzzles && puzzleId in solvedPuzzles; // Firestore solvedPuzzles

		// Priority 0: Already solved in Firestore (signed-in users only)
		if (user && hasSignedInSolve) {
			return {
				loadedGrid: getSolvedState(GRID_SIZE),
				wasSolved: true,
				shouldMigrate: false, // Already in Firestore
			};
		}

		// Priority 1: localStorage completion (migrate to Firestore when signing in)
		if (user && localCompletion?.isCompleted) {
			return {
				loadedGrid: getSolvedState(GRID_SIZE),
				wasSolved: true,
				shouldMigrate: true, // Migrate to Firestore
			};
		}

		// Migration: Handle old nested format from before simplification
		// Old: gameState[puzzleId][3].grid, New: gameState[puzzleId].grid
		let actualSavedGame = savedGame;
		if (savedGame && savedGame[3]) {
			actualSavedGame = savedGame[3]; // Use 3x3 data from old format
		}

		// Helper: Check if savedGame is just the initial grid (no real progress)
		const isInitialGrid = (grid) => {
			if (!grid) return false;
			return JSON.stringify(grid) === JSON.stringify(initialGrid);
		};

		const hasFirestoreProgress =
			actualSavedGame && !isInitialGrid(actualSavedGame.grid);

		// Priority 2: Firestore saved game with actual progress (signed-in users only)
		if (hasFirestoreProgress) {
			return {
				loadedGrid: convertGridFromFirestore(actualSavedGame.grid),
				wasSolved: false,
				shouldMigrate: false,
			};
		}
		// Priority 3: Check localStorage for signed-out user completions
		// (Trophies persist even when signed out, but not in-progress games)
		if (!user && localCompletion?.isCompleted) {
			return {
				loadedGrid: getSolvedState(GRID_SIZE),
				wasSolved: true,
				shouldMigrate: false,
			};
		}

		// Default: Starting fresh (null grid = show initialGrid)
		return {
			loadedGrid: null,
			wasSolved: false,
			shouldMigrate: false,
		};
	}, [user, puzzleId, initialGrid, savedGame, solvedPuzzles]);

	// Handle side effects (Firestore mutations) in useEffect
	useEffect(() => {
		// Don't run if puzzle data isn't loaded yet
		if (!initialGrid || !puzzleId) {
			return;
		}

		// Migrate localStorage completion to Firestore
		if (shouldMigrate) {
			saveCompletionToFirestore({
				puzzleId,
				emoji: puzzleEmoji,
				emojiName: puzzleEmojiName,
			});
			clearLocalProgress(puzzleId);
		}

		// Save initial state to Firestore when starting fresh (signed-in users only)
		if (user && !savedGame && !shouldMigrate && initialGrid) {
			saveStartToFirestore({
				puzzleId,
				initialGrid,
			});
		}
	}, [
		shouldMigrate,
		user,
		savedGame,
		puzzleId,
		puzzleEmoji,
		puzzleEmojiName,
		initialGrid,
		saveCompletionToFirestore,
		saveStartToFirestore,
	]);

	return { loadedGrid, wasSolved };
}
