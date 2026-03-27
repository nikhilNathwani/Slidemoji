/**
 * useFirestoreMutations - React Query mutations for Firestore game operations
 *
 * Encapsulates all the React Query mutation boilerplate for saving game data to Firestore.
 * Function names mirror Firestore schema fields:
 * - saveGameStateToFirestore → updates gameState[puzzleId]
 * - saveSolvedPuzzleToFirestore → updates solvedPuzzles[puzzleId] + clears gameState
 *
 * Returns: {
 *   saveGameStateToFirestore, // Handles both start and move (both update gameState)
 *   saveSolvedPuzzleToFirestore
 * }
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useCallback } from "react";
import { saveGameState, saveSolvedPuzzle } from "../backend/database";
import { addPuzzleSolve } from "../utils/statsHelpers";

export function useFirestoreMutations() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// React Query mutation for saving game state (handles both start and move)
	// Both operations update gameState[puzzleId][difficulty]
	const gameStateMutation = useMutation({
		mutationFn: ({ puzzleId, grid, difficulty }) => {
			if (!user?.uid) return Promise.resolve();
			// saveGameState handles both initial grids and in-progress grids
			return saveGameState(user.uid, puzzleId, { grid, difficulty });
		},
		onMutate: ({ puzzleId, grid, difficulty }) => {
			// Optimistic update: update cache immediately for instant UI update
			if (user?.uid) {
				queryClient.setQueryData(["user", user.uid], (prevData) => {
					if (!prevData) return prevData;

					// Deep clone to avoid mutations
					const newData = {
						...prevData,
						gameState: {
							...prevData.gameState,
							[puzzleId]: {
								...prevData.gameState?.[puzzleId],
								[difficulty]: grid, // Already in client format (null for gap)
								currentDifficulty: difficulty, // Track current difficulty for refresh
							},
						},
					};
					return newData;
				});
			}
		},
		onError: (error) => {
			console.error("Error saving game state:", error);
			// Could rollback optimistic update here if needed
		},
	});

	// React Query mutation for saving solved puzzles
	// Updates solvedPuzzles[puzzleId][difficulty] and clears gameState[puzzleId][difficulty]
	const solvedPuzzleMutation = useMutation({
		mutationFn: ({ puzzleId, difficulty }) => {
			if (!user?.uid) return Promise.resolve();
			return saveSolvedPuzzle(user.uid, puzzleId, difficulty);
		},
		onMutate: ({ puzzleId, difficulty }) => {
			// Optimistic update: add solve to cache immediately for instant UI update
			if (user?.uid) {
				queryClient.setQueryData(["user", user.uid], (prevData) =>
					addPuzzleSolve(prevData, puzzleId, difficulty),
				);
			}
		},
		onError: (error) => {
			console.error("Error saving completion:", error);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", user?.uid] });
		},
	});

	// Return wrapper functions that trigger the mutations
	const saveGameStateToFirestore = useCallback(
		(data) => gameStateMutation.mutate(data),
		[gameStateMutation],
	);
	const saveSolvedPuzzleToFirestore = useCallback(
		(data) => solvedPuzzleMutation.mutate(data),
		[solvedPuzzleMutation],
	);

	return {
		saveGameStateToFirestore,
		saveSolvedPuzzleToFirestore,
	};
}
