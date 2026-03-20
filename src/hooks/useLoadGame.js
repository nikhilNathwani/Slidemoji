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

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";
import { getLocalCompletion, clearLocalProgress } from "../utils/localStorage";
import { getSolvedState } from "../utils/gridHelpers";

export function useLoadGame({ puzzleId, gridSize, puzzleData, savedGame }) {
	const { user } = useAuth();
	const { saveStartToFirestore, saveCompletionToFirestore } =
		useFirestoreMutations();
	const [initResult, setInitResult] = useState(null);

	useEffect(() => {
		const localCompletion = getLocalCompletion(puzzleId, gridSize);
		console.log("[useLoadGame] Starting load:", {
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
			// Check for localStorage completions to migrate (signed in after completing while signed out)
			if (localCompletion?.isCompleted) {
				saveCompletionToFirestore({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				clearLocalProgress(puzzleId, gridSize);
				console.log("[GAME] Migrated completion from localStorage");
			}

			setInitResult({
				loadedGrid: savedGame.grid,
				wasSolved: false,
			});
			return;
		}

		// Priority 2: localStorage completion (signed in with no Firestore progress)
		if (user) {
			if (localCompletion?.isCompleted) {
				// Migrate completion to Firestore
				saveCompletionToFirestore({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				clearLocalProgress(puzzleId, gridSize);
				console.log("[GAME] Migrated completion from localStorage");

				// Show solved grid with trophy
				setInitResult({
					loadedGrid: getSolvedState(gridSize),
					wasSolved: true,
				});
				return;
			}

			// Signed-in user starting fresh - save initial state to Firestore
			saveStartToFirestore({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}

		// Priority 3: Check localStorage for signed-out user completions
		// (Trophies persist even when signed out, but not in-progress games)
		if (!user && localCompletion?.isCompleted) {
			console.log("[useLoadGame] Priority 3: Signed-out completion found");
			setInitResult({
				loadedGrid: getSolvedState(gridSize),
				wasSolved: true,
			});
			return;
		}

		// Default: Start fresh (signed-in with no save, or signed-out with no completion)
		console.log("[useLoadGame] Default: Starting fresh");
		setInitResult({
			loadedGrid: null, // null means "show fresh puzzle from puzzleData"
			wasSolved: false,
		});

		// Empty deps: runs once on mount, all data is ready via props
		// Component remounts when user/puzzleId/gridSize changes (via key prop in App)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return initResult || { loadedGrid: null, wasSolved: false };
}
