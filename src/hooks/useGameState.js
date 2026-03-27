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
import {
	getLocalCompletion,
	saveLocalGameState,
	saveLocalSolvedPuzzle,
} from "../utils/localStorage";
import { getSolvedState, checkWin } from "../utils/gridHelpers";
import { convertGridFromFirestore } from "../utils/puzzleUtils";

export function useGameState({ puzzleMetadata, userData }) {
	const puzzleId = puzzleMetadata?.id;
	const { user } = useAuth();

	// Compute initial/loaded game state from puzzleMetadata and userData
	const loadedGameState = useMemo(() => {
		if (!puzzleMetadata?.initialGrids) return null;

		const savedGameState = userData?.gameState?.[puzzleId];
		const localData = getLocalCompletion(puzzleId);

		// Helper: Get saved grid for a difficulty
		const getSavedGrid = (diff) => {
			// Check Firestore gameState first (includes both in-progress and solved)
			const savedGrid = savedGameState?.[diff];
			if (savedGrid && Array.isArray(savedGrid)) {
				return convertGridFromFirestore(savedGrid);
			}
			// Check localStorage grids (for signed-out users)
			const localGrid = localData?.grids?.[diff];
			if (localGrid && Array.isArray(localGrid)) {
				return localGrid; // Already in client format
			}
			// Fallback: Solved in localStorage but no grid saved? Generate solved state
			if (localData?.[diff]) {
				return getSolvedState(getDifficultySize(diff));
			}
			return null;
		};

		// Load currentDifficulty from saved state (Firestore or localStorage)
		const loadedDifficulty =
			savedGameState?.currentDifficulty ||
			localData?.currentDifficulty ||
			DEFAULT_DIFFICULTY;

		const result = {
			normal:
				getSavedGrid(DIFFICULTY.NORMAL) ||
				puzzleMetadata.initialGrids.normal,
			hard:
				getSavedGrid(DIFFICULTY.HARD) ||
				puzzleMetadata.initialGrids.hard,
			currentDifficulty: loadedDifficulty,
		};

		console.log("[useGameState] loadedGameState computed:", {
			puzzleId,
			user: user?.uid || "anonymous",
			loadedDifficulty,
			hasNormalGrid: !!savedGameState?.[DIFFICULTY.NORMAL],
			hasHardGrid: !!savedGameState?.[DIFFICULTY.HARD],
			hasLocalData: !!localData,
			hasLocalGrids: !!localData?.grids,
		});

		return result;
	}, [puzzleMetadata, userData, puzzleId, user]);

	// Track the last puzzle/user combo we initialized for
	const initKeyRef = useRef(null);
	const currentInitKey = `${puzzleId}-${user?.uid || "anon"}`;

	// Component state for game (can be updated independently via setGameState)
	const [gameState, setGameStateInternal] = useState(null);

	// Initialize or reinitialize when puzzle/user changes
	useEffect(() => {
		if (loadedGameState && initKeyRef.current !== currentInitKey) {
			console.log("[useGameState] Initializing state:", {
				currentInitKey,
				prevInitKey: initKeyRef.current,
				loadedGameState,
			});
			// Valid use of setState in effect: synchronizing with async external data (Firestore)
			// biome-ignore lint/correctness/useHookAtTopLevel: setState in effect is necessary for async data synchronization
			setGameStateInternal(loadedGameState);
			initKeyRef.current = currentInitKey;
		}
	}, [loadedGameState, currentInitKey]);

	// Get Firestore mutation functions
	const { saveGameStateToFirestore, saveSolvedPuzzleToFirestore } =
		useFirestoreMutations();

	// Setter that handles game logic and persistence
	const setGameState = useCallback(
		({ grid, currentDifficulty: newDifficulty }) => {
			if (!puzzleMetadata?.initialGrids) return;

			// Helper: Save grid to Firestore or localStorage based on auth status
		const saveGameState = (difficulty, grid) => {
			if (user) {
				saveGameStateToFirestore({
					puzzleId,
					grid,
					difficulty,
				});
			} else {
				saveLocalGameState(puzzleId, difficulty, grid);
			}
		};

		// Helper: Save trophy to Firestore or localStorage based on auth status
		const saveSolvedPuzzle = (difficulty) => {
			if (user) {
				saveSolvedPuzzleToFirestore({ puzzleId, difficulty });
			} else {
				saveLocalSolvedPuzzle(puzzleId, difficulty);
			}
		};

		// Mode 1: Difficulty switch (no grid provided)
		if (newDifficulty && !grid) {
			console.log("[useGameState] Difficulty switch:", {
				newDifficulty,
				currentGameState: gameState,
			});

			// Persist current grid for new difficulty (inline fallback to initial)
			saveGameState(
				newDifficulty,
				gameState?.[newDifficulty] ||
					puzzleMetadata.initialGrids[newDifficulty],
			);

			// Update React state
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
			const isSolved = checkWin(grid);

			console.log("[useGameState] Grid update:", {
				difficulty,
				isSolved,
				puzzleId,
				isSignedIn: !!user,
			});

			// Always save grid state
			saveGameState(difficulty, grid);

			// If solved, also save trophy
			if (isSolved) {
				saveSolvedPuzzle(difficulty);
				setGameStateInternal((prev) => ({
					...prev,
					[difficulty]: grid,
					currentDifficulty: difficulty,
				}));
			}
		},
		[
			user,
			gameState,
			puzzleMetadata,
			puzzleId,
			saveGameStateToFirestore,
			saveSolvedPuzzleToFirestore,
		],
	);

	return [gameState, setGameState];
}
