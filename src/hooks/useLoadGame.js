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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
	saveGameStart,
	saveGameMove,
	saveGameCompletion,
} from "../backend/database";

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
	const queryClient = useQueryClient();
	const [initResult, setInitResult] = useState(null);

	// React Query mutations for Firestore operations
	const gameStartMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, initialGrid }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameStart(user.uid, puzzleId, gridSize, initialGrid);
		},
		onError: (error) => {
			console.error("Error starting puzzle:", error);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", user?.uid] });
		},
	});

	const gameMoveMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, grid }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameMove(user.uid, puzzleId, gridSize, { grid });
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
		},
	});

	const gameCompletionMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, emoji, emojiName }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameCompletion(user.uid, puzzleId, gridSize, {
				emoji,
				emojiName,
			});
		},
		onError: (error) => {
			console.error("Error saving completion:", error);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", user?.uid] });
		},
	});

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
			if (localProgress) {
				const { isCompleted: wasCompleted } = localProgress;

				if (wasCompleted) {
					// Migrate completed puzzles (signing in should never lose a trophy)
				gameCompletionMutation.mutate({
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

		// Priority 2: localStorage data (signed in with no Firestore progress, migrating to Firestore)
		if (localProgress && user) {
			const {
				isCompleted: wasCompleted,
				grid,
				initialGrid,
			} = localProgress;

			if (wasCompleted) {
				// Migrate completion
				gameCompletionMutation.mutate({
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
				// Migrate in-progress work
				gameStartMutation.mutate({
					puzzleId: puzzleData.id,
					gridSize,
					initialGrid,
				});
				gameMoveMutation.mutate({
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

		// Priority 3: Start fresh (signed in user with no saved game)
		if (user) {
			gameStartMutation.mutate({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}

		// Priority 4: Anonymous user starting fresh
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
