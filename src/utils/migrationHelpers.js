/**
 * migrationHelpers.js - Utilities for migrating localStorage data to Firestore
 *
 * When a user signs in, we need to migrate any localStorage game progress to Firestore
 * so they don't lose their progress. Only migrates the CURRENT puzzle (today's puzzle).
 */

import { getLocalCompletion, clearLocalProgress } from "./localStorage";
import { saveSolvedPuzzle } from "../backend/database";
import { DIFFICULTY } from "../constants";

/**
 * Migrate localStorage solved puzzles to Firestore for the current puzzle only
 *
 * Only migrates today's puzzle to avoid retroactive trophy awards.
 * localStorage cleanup ensures only current puzzle exists anyway.
 *
 * @param {string} userId - Firebase user ID
 * @param {number} currentPuzzleId - Today's puzzle ID
 * @returns {Promise<void>}
 */
export async function migrateLocalStorageToFirestore(userId, currentPuzzleId) {
	if (!userId || !currentPuzzleId) return;

	const localCompletion = getLocalCompletion(currentPuzzleId);
	if (!localCompletion) return;

	// Migrate both difficulties if completed
	const migrations = [];
	if (localCompletion[DIFFICULTY.NORMAL]) {
		migrations.push(
			saveSolvedPuzzle(userId, currentPuzzleId, DIFFICULTY.NORMAL),
		);
	}
	if (localCompletion[DIFFICULTY.HARD]) {
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
			`[Migration] Migrated current puzzle ${currentPuzzleId} to Firestore`,
		);
	}
}
