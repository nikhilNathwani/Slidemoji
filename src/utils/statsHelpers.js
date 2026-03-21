import { GRID_SIZE } from "../constants";
import { getSignedOutMaxSolved } from "./localStorage";

/**
 * Add a puzzle solution to the user's solved puzzles (3x3 only)
 * Safely handles object creation
 *
 * @param {Object} userData - Current user data object
 * @param {number} puzzleId - Puzzle ID
 * @param {Object} solutionData - Solution data to save (e.g., { completedAt, emoji, emojiName })
 * @returns {Object} Updated user data with new solution
 */
export function addPuzzleSolution(userData, puzzleId, solutionData) {
	if (!userData || !userData.stats) return userData;

	return {
		...userData,
		stats: {
			...userData.stats,
			solvedPuzzles: {
				...userData.stats.solvedPuzzles,
				[puzzleId]: solutionData,
			},
		},
	};
}

/**
 * Get the grid size if puzzle is solved (3x3 only)
 * Handles both signed-in users (Firestore) and signed-out users (localStorage)
 *
 * @param {Object} userData - User data object (null/undefined for signed-out users)
 * @param {number} puzzleId - Puzzle ID
 * @returns {number} Grid size if solved (3), or 0 if not solved
 */
export function getMaxGridSizeSolved(userData, puzzleId) {
	// Signed-in user: check Firestore data
	if (userData?.stats?.solvedPuzzles?.[puzzleId]) {
		return GRID_SIZE;
	}

	// Signed-out user: check localStorage
	return getSignedOutMaxSolved(puzzleId);
}
