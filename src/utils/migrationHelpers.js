/**
 * migrationHelpers.js - Utilities for migrating localStorage data to Firestore
 *
 * When a user signs in, we need to migrate any localStorage game progress to Firestore
 * so they don't lose their progress. Migrates both solved puzzles and in-progress grids
 * for the CURRENT puzzle only (today's puzzle).
 */

import { getLocalCompletion, clearLocalProgress } from "./localStorage";
import { saveSolvedPuzzle, saveGameState } from "../backend/database";
import { DIFFICULTY } from "../constants";

/**
 * Migrate localStorage game data to Firestore for the current puzzle only
 *
 * Migrates both solved puzzles (trophies) and in-progress grids.
 * Only migrates today's puzzle to avoid retroactive trophy awards.
 * localStorage cleanup ensures only current puzzle exists anyway.
 *
 * @param {string} userId - Firebase user ID
 * @param {number} currentPuzzleId - Today's puzzle ID
 * @returns {Promise<void>}
 */
export async function migrateLocalStorageToFirestore(userId, currentPuzzleId) {
	if (!userId || !currentPuzzleId) return;

	const localData = getLocalCompletion(currentPuzzleId);
	if (!localData) return;

	const migrations = [];

	// Migrate in-progress grids (both difficulties if they exist)
	if (localData.grids) {
		if (localData.grids[DIFFICULTY.NORMAL]) {
			migrations.push(
				saveGameState(userId, currentPuzzleId, {
					grid: localData.grids[DIFFICULTY.NORMAL],
					difficulty: DIFFICULTY.NORMAL,
				}),
			);
		}
		if (localData.grids[DIFFICULTY.HARD]) {
			migrations.push(
				saveGameState(userId, currentPuzzleId, {
					grid: localData.grids[DIFFICULTY.HARD],
					difficulty: DIFFICULTY.HARD,
				}),
			);
		}
	}

	// Migrate solved puzzles (trophies)
	if (localData[DIFFICULTY.NORMAL]) {
		migrations.push(
			saveSolvedPuzzle(userId, currentPuzzleId, DIFFICULTY.NORMAL),
		);
	}
	if (localData[DIFFICULTY.HARD]) {
		migrations.push(
			saveSolvedPuzzle(userId, currentPuzzleId, DIFFICULTY.HARD),
		);
	}

	// Wait for all migrations to complete
	if (migrations.length > 0) {
		await Promise.all(migrations);
		// Clear localStorage after successful migration
		clearLocalProgress(currentPuzzleId);
		console.log(
			`[Migration] Migrated current puzzle ${currentPuzzleId} to Firestore (grids + trophies)`,
		);
	}
}
