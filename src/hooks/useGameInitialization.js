/**
 * useGameInitialization - Hook to initialize game state on mount
 *
 * Handles:
 * - Loading saved game from Firestore or localStorage
 * - Migrating localStorage progress when signing in
 * - Determining initial grid state
 * - Starting fresh games
 *
 * Returns: { initialGrid, wasCompleted, isReady }
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
	useSavePuzzleStart,
	useSaveGameState,
	useSaveCompletion,
} from "./useGameMutations";

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

export function useGameInitialization({
	puzzleId,
	gridSize,
	puzzleData,
	savedGame,
}) {
	const { user } = useAuth();
	const [initResult, setInitResult] = useState(null);

	// Firestore mutations
	const { mutate: savePuzzleStart } = useSavePuzzleStart(user?.uid);
	const { mutate: saveMove } = useSaveGameState(user?.uid);
	const { mutate: saveCompletion } = useSaveCompletion(user?.uid);

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

		// Priority 1: Firestore saved game with actual progress (when signed in)
		if (hasFirestoreProgress) {
			// If there's also localStorage data from being signed out, migrate completions only
			if (localProgress && user) {
				const { isCompleted: wasCompleted } = localProgress;

				if (wasCompleted) {
					// Migrate completed puzzles (signing in should never lose a trophy)
					saveCompletion({
						puzzleId: puzzleData.id,
						gridSize,
						emoji: puzzleData.emoji,
						emojiName: puzzleData.emojiName,
					});
					console.log("[GAME] Migrated completion from localStorage");
				}
				// Note: In-progress localStorage data is discarded (Firestore state takes precedence)

				clearLocalProgress(puzzleId, gridSize);
			}

			setInitResult({
				initialGrid: savedGame.grid,
				wasCompleted: false,
			});
			return;
		}

		// Priority 2: localStorage data (signed out progress, or signed in with no real Firestore progress)
		if (localProgress && user) {
			const {
				isCompleted: wasCompleted,
				grid,
				initialGrid,
			} = localProgress;

			if (wasCompleted) {
				// Migrate completion
				saveCompletion({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				console.log("[GAME] Migrated completion from localStorage");

				clearLocalProgress(puzzleId, gridSize);
				setInitResult({
					initialGrid: grid,
					wasCompleted: true,
				});
				return;
			}

			if (grid && initialGrid) {
				// Migrate in-progress work (better than initial Firestore state or no state)
				savePuzzleStart({
					puzzleId: puzzleData.id,
					gridSize,
					initialGrid,
				});
				saveMove({
					puzzleId: puzzleData.id,
					gridSize,
					grid,
				});
				console.log("[GAME] Migrated progress from localStorage");

				clearLocalProgress(puzzleId, gridSize);
				setInitResult({
					initialGrid: grid,
					wasCompleted: false,
				});
				return;
			}
		}

		// Priority 3: Start fresh
		if (user) {
			savePuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}

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
