/**
 * useGameState - Unified hook for game state loading and saving
 *
 * Manages game state using React Query for automatic caching, optimistic updates,
 * and reactivity. Firestore offline persistence handles sync automatically.
 *
 * const [gameState, setGameState] = useGameState({ puzzleMetadata, userData })
 *
 * Returns:
 * - gameState: { normal: grid, hard: grid, currentDifficulty }
 * - setGameState: ({ grid?, currentDifficulty? }) => void
 *
 * This hook:
 * - Uses React Query for caching and optimistic updates (no manual useState hacks)
 * - Routes to Firestore (signed-in) or localStorage (anonymous) automatically
 * - Firestore offline persistence handles offline sync automatically
 * - Handles migrations from localStorage to Firestore
 * - Initializes fresh puzzles
 */

import { useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { DIFFICULTY, DEFAULT_DIFFICULTY } from "../constants";
import { useAuth } from "./useAuth";
import {
	getAnonymousGameState,
	saveAnonymousGameState,
} from "../storage/anonymous";
import { convertGridFromStorage } from "../utils/puzzleUtils";
import { checkWin } from "../utils/gridHelpers";

export function useGameState({ puzzleMetadata, userData }) {
	const puzzleId = puzzleMetadata?.id;
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// Compute game state from puzzleMetadata and userData
	// React Query will handle caching and reactivity automatically
	const gameState = useMemo(() => {
		if (!puzzleMetadata?.initialGrids) return null;

		// Wait for userData to load if user is signed in
		if (user && userData === undefined) {
			return null;
		}

		// Get saved state - route based on auth
		let savedGameState;
		if (user) {
			// Signed-in: Use Firestore (via userData from React Query)
			savedGameState = userData?.gameState?.[puzzleId];
		} else {
			// Anonymous: Use localStorage
			savedGameState = getAnonymousGameState(puzzleId);
		}

		// Helper: Get saved grid for a difficulty
		const getSavedGrid = (diff) => {
			const grid = savedGameState?.[diff];
			if (!grid || !Array.isArray(grid)) return null;
			// Convert 0 to null for internal representation
			return convertGridFromStorage(grid);
		};

		// Current difficulty: saved > default
		const currentDifficulty =
			savedGameState?.currentDifficulty || DEFAULT_DIFFICULTY;

		return {
			normal:
				getSavedGrid(DIFFICULTY.NORMAL) ||
				puzzleMetadata.initialGrids.normal,
			hard:
				getSavedGrid(DIFFICULTY.HARD) ||
				puzzleMetadata.initialGrids.hard,
			currentDifficulty,
		};
	}, [puzzleMetadata, userData, puzzleId, user]);

	// Mutation for saving game state with optimistic updates
	const mutation = useMutation({
		mutationFn: async ({ grid, difficulty }) => {
			if (user) {
				// Signed-in: Save to Firestore
				// Offline persistence will queue this if offline
				const userDocRef = doc(db, "users", user.uid);
				const firestoreGrid = grid.map((v) => (v === null ? 0 : v));
				const isSolved = checkWin(grid);

				const updateData = {
					[`gameState.${puzzleId}.${difficulty}`]: firestoreGrid,
					[`gameState.${puzzleId}.currentDifficulty`]: difficulty,
					updatedAt: serverTimestamp(),
				};

				if (isSolved) {
					updateData[`gameState.${puzzleId}.solved.${difficulty}`] =
						true;
				}

				await updateDoc(userDocRef, updateData);
			} else {
				// Anonymous: Save to localStorage (instant)
				saveAnonymousGameState(puzzleId, difficulty, grid);
			}
		},
		// Optimistic update: UI updates IMMEDIATELY before network call
		onMutate: async ({ grid, difficulty }) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({
				queryKey: ["userData", user?.uid],
			});

			// This will cause gameState (computed from userData) to update immediately
			// triggering a re-render with the new grid
			if (user) {
				// For signed-in users, optimistically update the userData cache
				queryClient.setQueryData(["userData", user.uid], (oldData) => {
					if (!oldData) return oldData;
					const firestoreGrid = grid.map((v) => (v === null ? 0 : v));
					return {
						...oldData,
						gameState: {
							...(oldData.gameState || {}),
							[puzzleId]: {
								...(oldData.gameState?.[puzzleId] || {}),
								[difficulty]: firestoreGrid,
								currentDifficulty: difficulty,
							},
						},
					};
				});
			}
			// For anonymous users, saveAnonymousGameState is synchronous,
			// so the next render will pick up the new value automatically
		},
		// If mutation fails, React Query will automatically refetch
		// to restore correct state (no manual rollback needed)
	});

	// Setter that handles game logic
	const setGameState = useCallback(
		({ grid, currentDifficulty: newDifficulty }) => {
			if (!puzzleMetadata?.initialGrids || !gameState) return;

			// Case 1: Difficulty switch (no grid provided)
			if (newDifficulty && !grid) {
				const gridToSave =
					gameState[newDifficulty] ||
					puzzleMetadata.initialGrids[newDifficulty];
				mutation.mutate({
					grid: gridToSave,
					difficulty: newDifficulty,
				});
				return;
			}

			// Case 2: Grid update (move made)
			if (grid) {
				const difficulty = gameState.currentDifficulty;
				mutation.mutate({ grid, difficulty });
			}
		},
		[mutation, gameState, puzzleMetadata],
	);

	return [gameState, setGameState];
}
