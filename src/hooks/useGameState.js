/**
 * useGameState - Unified hook for game state loading and saving
 *
 * Manages game state including loading, saving, and difficulty switching.
 *
 * const [gameState, setGameState] = useGameState({ puzzleMetadata, userData })
 *
 * Returns:
 * - gameState: { normal: grid, hard: grid, currentDifficulty }
 * - setGameState: ({ grid?, currentDifficulty? }) => void
 *
 * This hook:
 * - Loads saved game state from Firestore or localStorage
 * - Checks for solved puzzles
 * - Handles migrations from localStorage to Firestore
 * - Initializes fresh puzzles
 * - Automatically saves moves/solves/restarts by comparing grid state
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
	DIFFICULTY,
	DEFAULT_DIFFICULTY,
	getDifficultySize,
	getDifficultyFromGrid,
} from "../constants";
import { useAuth } from "./useAuth";
import { useFirestoreMutations } from "./useFirestoreMutations";
import { getLocalCompletion, saveLocalCompletion } from "../utils/localStorage";
import { getSolvedState, checkWin } from "../utils/gridHelpers";
import { convertGridFromFirestore } from "../utils/puzzleUtils";

export function useGameState({ puzzleMetadata, userData }) {
	const puzzleId = puzzleMetadata?.id;
	const { user } = useAuth();

	// Compute initial/loaded game state from puzzleMetadata and userData
	const loadedGameState = useMemo(() => {
		if (!puzzleMetadata?.initialGrids) return null;

		const savedGameState = userData?.gameState?.[puzzleId];
		const solvedPuzzles = userData?.stats?.solvedPuzzles?.[puzzleId];
		const localCompletion = getLocalCompletion(puzzleId);

		// Helper: Get saved grid for a difficulty
		const getSavedGrid = (diff) => {
			// Solved in Firestore?
			if (user && solvedPuzzles?.[diff]) {
				return getSolvedState(getDifficultySize(diff));
			}
			// Solved in localStorage (needs migration if signed in)?
			if (localCompletion?.[diff]) {
				return getSolvedState(getDifficultySize(diff));
			}
			// In-progress in Firestore?
			const savedGrid = savedGameState?.[diff];
			if (savedGrid && Array.isArray(savedGrid)) {
				return convertGridFromFirestore(savedGrid);
			}
			return null;
		};

		// Load currentDifficulty from saved state (Firestore or localStorage)
		const loadedDifficulty =
			savedGameState?.currentDifficulty ||
			localCompletion?.currentDifficulty ||
			DEFAULT_DIFFICULTY;

		return {
			normal:
				getSavedGrid(DIFFICULTY.NORMAL) ||
				puzzleMetadata.initialGrids.normal,
			hard:
				getSavedGrid(DIFFICULTY.HARD) ||
				puzzleMetadata.initialGrids.hard,
			currentDifficulty: loadedDifficulty,
		};
	}, [puzzleMetadata, userData, puzzleId, user]);

	// Track the last puzzle/user combo we initialized for
	const initKeyRef = useRef(null);
	const currentInitKey = `${puzzleId}-${user?.uid || "anon"}`;

	// Local state for game (can be updated independently via setGameState)
	const [gameState, setGameStateInternal] = useState(null);

	// Initialize or reinitialize when puzzle/user changes
	useEffect(() => {
		if (loadedGameState && initKeyRef.current !== currentInitKey) {
			// Valid use of setState in effect: synchronizing with async external data (Firestore)
			// biome-ignore lint/correctness/useHookAtTopLevel: setState in effect is necessary for async data synchronization
			setGameStateInternal(loadedGameState);
			initKeyRef.current = currentInitKey;
		}
	}, [loadedGameState, currentInitKey]);

	// Get Firestore mutation functions
	const {
		saveStartToFirestore,
		saveMoveToFirestore,
		saveCompletionToFirestore,
	} = useFirestoreMutations();

	// Setter that handles game logic and persistence
	const setGameState = useCallback(
		({ grid, currentDifficulty: newDifficulty }) => {
			if (!puzzleMetadata?.initialGrids) return;

			// Mode 1: Difficulty switch (no grid provided)
			if (newDifficulty && !grid) {
				// Persist to Firestore if signed in
				if (user) {
					const gridToSave = gameState?.[newDifficulty];
					if (gridToSave) {
						saveMoveToFirestore({
							puzzleId,
							grid: gridToSave,
							difficulty: newDifficulty,
						});
					}
				}

				// Update local state
				setGameStateInternal((prev) => ({
					...prev,
					currentDifficulty: newDifficulty,
				}));
				return;
			}

			// Mode 2: Grid update
			if (grid) {
				// Infer difficulty from grid length
				const difficulty = getDifficultyFromGrid(grid);
				const initialGrid =
					difficulty === DIFFICULTY.NORMAL
						? puzzleMetadata.initialGrids.normal
						: puzzleMetadata.initialGrids.hard;

				// Infer action from grid state
				const isInitialGrid =
					JSON.stringify(grid) === JSON.stringify(initialGrid);
				const isSolvedGrid = checkWin(grid);

				// Save to Firestore/localStorage based on action
				if (isInitialGrid) {
					// Grid matches initial state → restart
					if (user) {
						saveStartToFirestore({
							puzzleId,
							initialGrid,
							difficulty,
						});
					}
					// Signed-out users don't persist restarts
				} else if (isSolvedGrid) {
					// Grid is solved → solve
					if (user) {
						saveCompletionToFirestore({
							puzzleId,
							difficulty,
						});
					} else {
						// Signed out: save completion flag only (for trophy display)
						saveLocalCompletion(puzzleId, difficulty);
					}
				} else {
					// Grid is in progress → move
					if (user) {
						saveMoveToFirestore({
							puzzleId,
							grid,
							difficulty,
						});
					}
					// Signed-out users don't persist moves (incentive to sign in)
				}

				// Update local state
				setGameStateInternal((prev) => ({
					...prev,
					[difficulty]: grid,
					currentDifficulty: difficulty, // Also update currentDifficulty when making moves
				}));
			}
		},
		[
			user,
			gameState,
			puzzleMetadata,
			puzzleId,
			saveMoveToFirestore,
			saveCompletionToFirestore,
			saveStartToFirestore,
		],
	);

	return [gameState, setGameState];
}
