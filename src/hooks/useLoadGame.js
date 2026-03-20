/**
 * useLoadGame - Hook to load game state on mount
 *
 * Handles:
 * - Loading saved game from Firestore or localStorage
 * - Migrating localStorage progress when signing in
 * - Determining initial grid state
 * - Starting fresh games
 *
 * Returns: { initialGrid, wasCompleted }
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";

// Get localStorage key for signed-out progress
const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Read signed-out progress from localStorage
const getLocalProgress = (puzzleId, gridSize) => {
	const key = getLocalStorageKey(puzzleId, gridSize);
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

// Clear localStorage after migration
const clearLocalProgress = (puzzleId, gridSize) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId, gridSize));
};

export function useLoadGame({ puzzleId, gridSize, puzzleData, savedGame }) {
	const { user } = useAuth();
	const {
		saveStartToFirestore,
		saveCompletionToFirestore,
	} = useFirestoreMutations();
	const [initResult, setInitResult] = useState(null);

	useEffect(() => {
		const localProgress = getLocalProgress(puzzleId, gridSize);

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
			if (localProgress?.isCompleted) {
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
				initialGrid: savedGame.grid,
				wasCompleted: false,
			});
			return;
		}

		// Priority 2: localStorage completion (signed in with no Firestore progress)
		if (user) {
			if (localProgress?.isCompleted) {
				// Migrate completion to Firestore
				saveCompletionToFirestore({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				clearLocalProgress(puzzleId, gridSize);
				console.log("[GAME] Migrated completion from localStorage");

				// Start fresh but mark as already completed
				setInitResult({
					initialGrid: null,
					wasCompleted: true,
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

		// Priority 3: Start fresh (signed-in with no save, or signed-out users always)
		// Signed-out users NEVER load saved progress (incentive to sign in)
		setInitResult({
			initialGrid: null, // null means "show initialGrid from puzzleData"
			wasCompleted: false,
		});

		// Empty deps: runs once on mount, all data is ready via props
		// Component remounts when user/puzzleId/gridSize changes (via key prop in App)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return initResult || { initialGrid: null, wasCompleted: false };
}
