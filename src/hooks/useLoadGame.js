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

export function useLoadGame({
	puzzleId,
	puzzleData,
	savedGame,
	solvedPuzzles,
}) {
	const { user } = useAuth();
	const { saveStartToFirestore, saveCompletionToFirestore } =
		useFirestoreMutations();

	// Extract primitive values from puzzleData to avoid object reference issues
	const puzzleEmoji = puzzleData.emoji;
	const puzzleEmojiName = puzzleData.emojiName;
	const initialGrid = puzzleData.initialGrid;

	// Compute initial state synchronously (runs on every render but memoized)
	const { loadedGrid, wasSolved, shouldMigrate } = useMemo(() => {
		// Check all data sources
		const localCompletion = getLocalCompletion(puzzleId); // localStorage completion flag
		const hasSignedInSolve = solvedPuzzles && puzzleId in solvedPuzzles; // Firestore solvedPuzzles
		console.log("[useLoadGame] Computing state:", {
			user: user?.uid || "signed-out",
			puzzleId,
			hasSignedOutSolve: !!localCompletion?.isCompleted,
			hasSignedInProgress: !!savedGame,
			hasSignedInSolve,
		});

		// Priority 0: Already solved in Firestore (signed-in users only)
		if (user && hasSignedInSolve) {
			console.log(
				"[useLoadGame] Priority 0: Already solved in Firestore",
			);
			return {
				loadedGrid: getSolvedState(GRID_SIZE),
				wasSolved: true,
				shouldMigrate: false, // Already in Firestore
			};
		}

		// Priority 1: localStorage completion (migrate to Firestore when signing in)
		if (user && localCompletion?.isCompleted) {
			console.log(
				"[useLoadGame] Priority 1: Signed-in user with localStorage completion (migrating)",
			);
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

		// Priority 2: Firestore saved game with actual progress (signed-in users only)
		if (hasFirestoreProgress) {
			console.log(
				"[useLoadGame] Priority 2: Firestore in-progress game found",
			);
			return {
				loadedGrid: actualSavedGame.grid,
				wasSolved: false,
				shouldMigrate: false,
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
			};
		}

		// Default: Starting fresh (null grid = show initialGrid)
		if (user) {
			console.log("[useLoadGame] Signed-in user starting fresh");
		} else {
			console.log("[useLoadGame] Signed-out user starting fresh");
		}
		return {
			loadedGrid: null,
			wasSolved: false,
			shouldMigrate: false,
		};
	}, [user, puzzleId, initialGrid, savedGame, solvedPuzzles]);

	// Handle side effects (Firestore mutations) in useEffect
	useEffect(() => {
		// Migrate localStorage completion to Firestore
		if (shouldMigrate) {
			saveCompletionToFirestore({
				puzzleId,
				emoji: puzzleEmoji,
				emojiName: puzzleEmojiName,
			});
			clearLocalProgress(puzzleId);
			console.log(
				"[useLoadGame] Migrated completion from localStorage to Firestore",
			);
		}

		// Save initial state to Firestore when starting fresh (signed-in users only)
		if (user && !savedGame && !shouldMigrate) {
			saveStartToFirestore({
				puzzleId,
				initialGrid,
			});
			console.log("[useLoadGame] Saved initial grid state to Firestore");
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
