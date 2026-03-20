/**
 * useSaveGame - Unified hook for game state persistence
 *
 * Handles saving game state (moves, completions, restarts) with automatic routing to:
 * - Firestore (for signed-in users) via React Query mutations
 * - localStorage (for signed-out users)
 *
 * Game.jsx doesn't need to know about storage strategy - it's all encapsulated here.
 *
 * Returns: { saveMove, saveCompletion, saveRestart }
 */

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

// Save signed-out progress to localStorage
const saveToLocalStorage = (
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	isCompleted,
) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId, gridSize),
		JSON.stringify({
			isCompleted,
			grid,
			initialGrid: puzzleData[gridSize],
		}),
	);
};

export function useSaveGame() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// React Query mutation for starting/restarting puzzles
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

	// React Query mutation for saving game state after moves
	const gameMoveMutation = useMutation({
		mutationFn: ({ puzzleId, gridSize, grid }) => {
			if (!user?.uid) return Promise.resolve();
			return saveGameMove(user.uid, puzzleId, gridSize, { grid });
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
		},
		// No cache invalidation - grid state is local only
	});

	// React Query mutation for saving completions
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

	/**
	 * Save game state after a move
	 * Routes to Firestore (signed in) or localStorage (signed out)
	 */
	const saveMove = ({ puzzleId, gridSize, grid, puzzleData }) => {
		if (user) {
			// Signed in: save to Firestore
			gameMoveMutation.mutate({
				puzzleId: puzzleData.id,
				gridSize,
				grid,
			});
		} else {
			// Signed out: save to localStorage
			saveToLocalStorage(puzzleId, gridSize, grid, puzzleData, false);
		}
	};

	/**
	 * Save game completion (win)
	 * Routes to Firestore (signed in) or localStorage (signed out)
	 */
	const saveCompletion = ({
		puzzleId,
		gridSize,
		grid,
		puzzleData,
		updateCacheImmediately,
	}) => {
		if (user) {
			// Signed in: save to Firestore
			updateCacheImmediately?.();
			gameCompletionMutation.mutate({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
		} else {
			// Signed out: save to localStorage
			saveToLocalStorage(puzzleId, gridSize, grid, puzzleData, true);
		}
	};

	/**
	 * Save game restart
	 * Only persists for signed-in users (signed-out users get ephemeral experience)
	 */
	const saveRestart = ({ gridSize, puzzleData }) => {
		if (user) {
			gameStartMutation.mutate({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid: puzzleData[gridSize],
			});
		}
		// Note: Signed-out users don't persist restarts
	};

	return {
		saveMove,
		saveCompletion,
		saveRestart,
	};
}
