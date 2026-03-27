/**
 * useGameState - Unified hook for game state loading and saving
 *
 * Manages game state including loading, saving, and difficulty switching.
 *
 * const [gameState, setGameState] = useGameState({ puzzleId, puzzleMetadata, userData })
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

import { useState, useMemo, useEffect } from "react";
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
	clearLocalProgress,
	saveLocalCompletion,
} from "../utils/localStorage";
import { getSolvedState, checkWin } from "../utils/gridHelpers";
import { convertGridFromFirestore } from "../utils/puzzleUtils";

export function useGameState({ puzzleId, puzzleMetadata, userData }) {
	const { user } = useAuth();
	const {
		saveStartToFirestore,
		saveMoveToFirestore,
		saveCompletionToFirestore,
	} = useFirestoreMutations();

	// Extract puzzle grids from metadata (memoized to prevent dependency issues)
	const normalPuzzle = useMemo(
		() =>
			puzzleMetadata
				? {
						initialGrid: puzzleMetadata.initialGrids.normal,
						emoji: puzzleMetadata.emoji,
						emojiName: puzzleMetadata.emojiName,
					}
				: null,
		[puzzleMetadata],
	);

	const hardPuzzle = useMemo(
		() =>
			puzzleMetadata
				? { initialGrid: puzzleMetadata.initialGrids.hard }
				: null,
		[puzzleMetadata],
	);

	// Compute initial state from Firestore/localStorage (only on mount or when data changes)
	const initialGameStateData = useMemo(() => {
		if (!normalPuzzle || !hardPuzzle) return null;

		const savedGameState = userData?.gameState?.[puzzleId];
		const solvedPuzzles = userData?.stats?.solvedPuzzles?.[puzzleId];
		const localCompletion = getLocalCompletion(puzzleId);

		// Helper to compute grid for a specific difficulty
		const computeGrid = (diff) => {
			const gridSize = getDifficultySize(diff);
			const initialGrid =
				diff === DIFFICULTY.NORMAL
					? normalPuzzle.initialGrid
					: hardPuzzle.initialGrid;
			const savedGrid = savedGameState?.[diff];

			// Priority 0: Already solved in Firestore (signed-in)
			if (user && solvedPuzzles?.[diff]) {
				return { grid: getSolvedState(gridSize), shouldMigrate: false };
			}

			// Priority 1: localStorage completion (signed-in user migrating)
			if (user && localCompletion?.[diff]) {
				return {
					grid: getSolvedState(gridSize),
					shouldMigrate: true,
				};
			}

			// Helper: Check if savedGrid is just the initial grid
			const isInitialGrid = (grid) => {
				if (!grid || !Array.isArray(grid)) return false;
				return JSON.stringify(grid) === JSON.stringify(initialGrid);
			};

			const hasFirestoreProgress =
				savedGrid &&
				Array.isArray(savedGrid) &&
				!isInitialGrid(savedGrid);

			// Priority 2: Firestore saved game with actual progress
			if (hasFirestoreProgress) {
				return {
					grid: convertGridFromFirestore(savedGrid),
					shouldMigrate: false,
				};
			}

			// Priority 3: localStorage completion (signed-out user)
			if (!user && localCompletion?.[diff]) {
				return { grid: getSolvedState(gridSize), shouldMigrate: false };
			}

			// Default: Fresh start (use initial grid)
			return { grid: initialGrid, shouldMigrate: false };
		};

		const normalState = computeGrid(DIFFICULTY.NORMAL);
		const hardState = computeGrid(DIFFICULTY.HARD);

		return {
			gameState: {
				normal: normalState.grid,
				hard: hardState.grid,
				currentDifficulty: DEFAULT_DIFFICULTY,
			},
			shouldMigrateInternal: {
				normal: normalState.shouldMigrate,
				hard: hardState.shouldMigrate,
			},
		};
	}, [normalPuzzle, hardPuzzle, userData, puzzleId, user]);

	// Use state to maintain current grid values (updates immediately on moves)
	// Initialize directly from computed data - no need for sync effect
	const [gameState, setGameStateInternal] = useState(
		() => initialGameStateData?.gameState || null,
	);
	const shouldMigrateInternal = initialGameStateData?.shouldMigrateInternal;

	// Handle migrations and initial state saves
	useEffect(() => {
		if (!initialGameStateData || !user) return;

		// Migrate localStorage completions to Firestore
		[DIFFICULTY.NORMAL, DIFFICULTY.HARD].forEach((diff) => {
			if (shouldMigrateInternal?.[diff]) {
				saveCompletionToFirestore({
					puzzleId,
					difficulty: diff,
				});
				console.log(
					`[useGameState] Migrated ${diff} completion from localStorage to Firestore`,
				);
			}
		});

		// Clear localStorage after migration
		if (shouldMigrateInternal?.normal || shouldMigrateInternal?.hard) {
			clearLocalProgress(puzzleId);
		}

		// Save initial state for difficulties that haven't been started yet
		const savedGameState = userData?.gameState?.[puzzleId];
		[DIFFICULTY.NORMAL, DIFFICULTY.HARD].forEach((diff) => {
			const gridSize = getDifficultySize(diff);
			const initialGrid =
				diff === DIFFICULTY.NORMAL
					? normalPuzzle?.initialGrid
					: hardPuzzle?.initialGrid;

			if (
				!savedGameState?.[diff] &&
				!shouldMigrateInternal?.[diff] &&
				initialGrid
			) {
				saveStartToFirestore({
					puzzleId,
					initialGrid,
					gridSize,
					difficulty: diff,
				});
				console.log(
					`[useGameState] Saved initial ${diff} grid state to Firestore`,
				);
			}
		});
	}, [
		initialGameStateData,
		shouldMigrateInternal,
		user,
		userData,
		puzzleId,
		normalPuzzle,
		hardPuzzle,
		saveCompletionToFirestore,
		saveStartToFirestore,
	]);

	// Setter function that handles both grid updates and difficulty switching
	const setGameState = useMemo(() => {
		/**
		 * Update game state - handles grid updates or difficulty switching
		 *
		 * Two modes:
		 * 1. Grid update: setGameState({ grid })
		 *    - Infers difficulty from grid length (9 = normal, 16 = hard)
		 *    - Infers action by comparing grid state:
		 *      • Grid matches initial grid → restart
		 *      • Grid is solved → solve
		 *      • Otherwise → move
		 *    - Updates local state immediately, then saves to Firestore/localStorage async
		 *
		 * 2. Difficulty switch: setGameState({ currentDifficulty })
		 *    - Switches which difficulty is displayed
		 *    - Preserves all grid data (doesn't reset anything)
		 *    - Persists the preference to Firestore for signed-in users
		 *
		 * Usage:
		 *   setGameState({ grid })  // for moves, restarts, solves
		 *   setGameState({ currentDifficulty: DIFFICULTY.HARD })  // for difficulty switching
		 */
		return ({ grid, currentDifficulty: newDifficulty }) => {
			if (!normalPuzzle || !hardPuzzle) return;

			// Mode 1: Difficulty switch (no grid provided)
			if (newDifficulty && !grid) {
				// Update local state immediately
				setGameStateInternal((prev) => ({
					...prev,
					currentDifficulty: newDifficulty,
				}));

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
				return;
			}

			// Mode 2: Grid update
			if (grid) {
				// Infer difficulty from grid length
				const difficulty = getDifficultyFromGrid(grid);
				const gridSize = getDifficultySize(difficulty);
				const initialGrid =
					difficulty === DIFFICULTY.NORMAL
						? normalPuzzle.initialGrid
						: hardPuzzle.initialGrid;

				// Update local state immediately (synchronous)
				setGameStateInternal((prev) => ({
					...prev,
					[difficulty]: grid,
				}));

				// Infer action from grid state for async save
				const isInitialGrid =
					JSON.stringify(grid) === JSON.stringify(initialGrid);
				const isSolvedGrid = checkWin(grid);

				// Save to Firestore/localStorage (asynchronous)
				if (isInitialGrid) {
					// Grid matches initial state → restart
					if (user) {
						saveStartToFirestore({
							puzzleId,
							initialGrid,
							gridSize,
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
			}
		};
	}, [
		user,
		puzzleId,
		normalPuzzle,
		hardPuzzle,
		gameState,
		saveMoveToFirestore,
		saveCompletionToFirestore,
		saveStartToFirestore,
	]);

	return [gameState, setGameState];
}
