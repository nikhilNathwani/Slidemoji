/**
 * Migration logic for transferring localStorage data to Firestore
 * Automatically runs when a user signs in to preserve their progress
 */

import { DIFFICULTY } from "../constants";
import { getAnonymousGameState, clearAnonymousGameState } from "./anonymous";
import { saveGameStateToFirestore } from "./firestore";

/**
 * Migrate localStorage game data to Firestore for the current puzzle only
 *
 * Called automatically after sign-in to preserve user's progress.
 * Only migrates today's puzzle to avoid retroactive trophy awards.
 *
 * @param {string} userId - Firebase user ID
 * @param {number} currentPuzzleId - Today's puzzle ID
 */
export async function migrateLocalStorageToFirestore(userId, currentPuzzleId) {
	if (!userId || !currentPuzzleId) return;

	const localData = getAnonymousGameState(currentPuzzleId);
	if (!localData) return;

	const migrations = [];

	// Migrate grids for both difficulties if they exist
	// saveGameStateToFirestore auto-detects solves and updates gameState.solved
	// Convert grids from 0 (localStorage) to null (client format) before saving
	if (localData[DIFFICULTY.NORMAL]) {
		const grid = localData[DIFFICULTY.NORMAL].map((cell) =>
			cell === 0 ? null : cell,
		);
		migrations.push(
			saveGameStateToFirestore(userId, currentPuzzleId, {
				grid,
				difficulty: DIFFICULTY.NORMAL,
			}),
		);
	}
	if (localData[DIFFICULTY.HARD]) {
		const grid = localData[DIFFICULTY.HARD].map((cell) =>
			cell === 0 ? null : cell,
		);
		migrations.push(
			saveGameStateToFirestore(userId, currentPuzzleId, {
				grid,
				difficulty: DIFFICULTY.HARD,
			}),
		);
	}

	// Wait for all migrations to complete
	if (migrations.length > 0) {
		await Promise.all(migrations);
		// Clear localStorage after successful migration
		clearAnonymousGameState(currentPuzzleId);
		console.log(
			`[Migration] Migrated puzzle ${currentPuzzleId} to Firestore`,
		);
	}
}
