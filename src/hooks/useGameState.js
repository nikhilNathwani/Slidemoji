/**
 * useGameState - Unified hook for game state loading and saving
 *
 * Uses Firestore's onSnapshot for real-time updates (no React Query needed).
 * Everyone uses Firestore (anonymous or Google via Firebase Anonymous Auth).
 *
 * const [gameState, setGameState] = useGameState({ puzzleMetadata })
 *
 * Returns:
 * - gameState: { normal: grid, hard: grid, currentDifficulty }
 * - setGameState: ({ grid?, currentDifficulty? }) => void
 *
 * This hook:
 * - Uses Firestore onSnapshot for real-time updates
 * - Automatic offline support via Firestore IndexedDB persistence
 * - No caching layer needed - Firestore SDK handles everything
 * - Eliminates dual storage and if(user) branching
 */

import { useState, useEffect, useCallback } from "react";
import {
	doc,
	onSnapshot,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { DIFFICULTY, DEFAULT_DIFFICULTY } from "../constants";
import { useAuth } from "./useAuth";
import { convertGridFromStorage } from "../utils/puzzleUtils";

export function useGameState({ puzzleMetadata }) {
	const puzzleId = puzzleMetadata?.id;
	const { user } = useAuth();
	const [gameState, setGameStateInternal] = useState(null);
	const [loading, setLoading] = useState(true);

	// Subscribe to user's Firestore document for real-time updates
	useEffect(() => {
		if (!user?.uid || !puzzleMetadata?.initialGrids) {
			setLoading(false);
			return;
		}

		setLoading(true);

		const userDocRef = doc(db, "users", user.uid);

		// Real-time subscription to Firestore
		const unsubscribe = onSnapshot(
			userDocRef,
			(docSnap) => {
				if (!docSnap.exists()) {
					// No user data yet - use initial grids
					setGameStateInternal({
						normal: puzzleMetadata.initialGrids.normal,
						hard: puzzleMetadata.initialGrids.hard,
						currentDifficulty: DEFAULT_DIFFICULTY,
					});
					setLoading(false);
					return;
				}

				const userData = docSnap.data();
				const savedGameState = userData?.gameState?.[puzzleId];

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

				setGameStateInternal({
					normal:
						getSavedGrid(DIFFICULTY.NORMAL) ||
						puzzleMetadata.initialGrids.normal,
					hard:
						getSavedGrid(DIFFICULTY.HARD) ||
						puzzleMetadata.initialGrids.hard,
					currentDifficulty,
				});
				setLoading(false);
			},
			(error) => {
				console.error(
					"[useGameState] Error subscribing to game state:",
					error,
				);
				// Fallback to initial grids on error
				setGameStateInternal({
					normal: puzzleMetadata.initialGrids.normal,
					hard: puzzleMetadata.initialGrids.hard,
					currentDifficulty: DEFAULT_DIFFICULTY,
				});
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, [user?.uid, puzzleId, puzzleMetadata]);

	// Setter that saves to Firestore
	const setGameState = useCallback(
		async ({ grid, currentDifficulty: newDifficulty }) => {
			if (!user?.uid || !puzzleMetadata?.initialGrids || !gameState)
				return;

			const userDocRef = doc(db, "users", user.uid);

			try {
				// Case 1: Difficulty switch (no grid provided)
				if (newDifficulty && !grid) {
					const gridToSave =
						gameState[newDifficulty] ||
						puzzleMetadata.initialGrids[newDifficulty];

					// Convert null to 0 for Firestore
					const firestoreGrid = gridToSave.map((v) =>
						v === null ? 0 : v,
					);

					await updateDoc(userDocRef, {
						[`gameState.${puzzleId}.currentDifficulty`]:
							newDifficulty,
						[`gameState.${puzzleId}.${newDifficulty}`]:
							firestoreGrid,
						updatedAt: serverTimestamp(),
					});
					return;
				}

				// Case 2: Grid update (move made)
				if (grid) {
					const difficulty = gameState.currentDifficulty;

					// Convert null to 0 for Firestore
					const firestoreGrid = grid.map((v) => (v === null ? 0 : v));

					// Check if puzzle is solved
					const { checkWin } =
						await import("../utils/gridHelpers.js");
					const isSolved = checkWin(grid);

					const updates = {
						[`gameState.${puzzleId}.${difficulty}`]: firestoreGrid,
						[`gameState.${puzzleId}.currentDifficulty`]: difficulty,
						updatedAt: serverTimestamp(),
					};

					// If solved, update solved field
					if (isSolved) {
						updates[`gameState.${puzzleId}.solved.${difficulty}`] =
							true;
					}

					await updateDoc(userDocRef, updates);
				}
			} catch (error) {
				console.error("[useGameState] Error saving game state:", error);
				throw error;
			}
		},
		[user?.uid, gameState, puzzleMetadata, puzzleId],
	);

	return [gameState, setGameState, loading];
}
