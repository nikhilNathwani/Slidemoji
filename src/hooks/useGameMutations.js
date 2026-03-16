/**
 * Game mutation hooks for Firestore writes
 *
 * These hooks use TanStack Query mutations to handle game-related Firestore writes:
 * - Auto-save game state after each move
 * - Record puzzle start (create gameState entry)
 * - Save puzzle completion (add trophy, update streaks)
 *
 * Benefits over manual Firestore calls:
 * - Centralized error handling
 * - Automatic retries on failure
 * - Loading states for UI feedback
 * - Cache invalidation triggers refetch
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	savePuzzleStart,
	saveGameState,
	saveCompletion,
} from "../firebase/firestore";

/**
 * useSavePuzzleStart - Mutation for starting a new puzzle
 * Creates gameState entry and updates play streak
 */
export function useSavePuzzleStart(userId) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ puzzleId, gridSize, initialGrid }) => {
			if (!userId) return Promise.resolve();
			return savePuzzleStart(userId, puzzleId, gridSize, initialGrid);
		},
		onError: (error) => {
			console.error("Error starting puzzle:", error);
		},
		// After starting puzzle, refetch user data to get updated gameState
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
		},
	});
}

/**
 * useSaveGameState - Mutation for auto-saving grid state after each move
 *
 * Important: No cache invalidation here!
 * - Grid state lives in local component state (instant updates)
 * - Cache is only used on initial load (resume saved game)
 * - During gameplay, cache is never consulted (all moves are local)
 * - On page refresh, browser clears cache → useUser fetches fresh from Firestore ✅
 * - After 10 minutes, cache goes stale → next access triggers refetch ✅
 *
 * Why we DON'T invalidate on every move:
 * - Would refetch entire user document after each tile slide (expensive!)
 * - Would cause race conditions (move → save → refetch → move conflicts)
 * - Would slow down gameplay (waiting for Firestore round-trip)
 * - Unnecessary: page refresh already clears cache, fresh fetch happens automatically
 */
export function useSaveGameState(userId) {
	return useMutation({
		mutationFn: ({ puzzleId, gridSize, grid }) => {
			if (!userId) return Promise.resolve();
			return saveGameState(userId, puzzleId, gridSize, { grid });
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
		},
		// No onSuccess/invalidation - grid state is local only
	});
}

/**
 * useSaveCompletion - Mutation for saving puzzle completion
 * Adds trophy, updates win streak, increments totalSolved
 */
export function useSaveCompletion(userId) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ puzzleId, gridSize, emoji, emojiName }) => {
			if (!userId) return Promise.resolve();
			return saveCompletion(userId, puzzleId, gridSize, {
				emoji,
				emojiName,
			});
		},
		onError: (error) => {
			console.error("Error saving completion:", error);
		},
		// After winning, refetch user data to get updated stats/trophies
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
		},
	});
}
