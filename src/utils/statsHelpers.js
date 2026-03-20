import { getSignedOutMaxSolved } from "./localStorage";

/**
 * Add a puzzle solution to the user's solved puzzles
 * Safely handles nested object creation
 *
 * @param {Object} userData - Current user data object
 * @param {number} puzzleId - Puzzle ID
 * @param {number} gridSize - Grid size (3 or 4)
 * @param {Object} solutionData - Solution data to save (e.g., { completedAt, emoji, emojiName })
 * @returns {Object} Updated user data with new solution
 */
export function addPuzzleSolution(userData, puzzleId, gridSize, solutionData) {
	if (!userData || !userData.stats) return userData;

	return {
		...userData,
		stats: {
			...userData.stats,
			solvedPuzzles: {
				...userData.stats.solvedPuzzles,
				[puzzleId]: {
					...userData.stats.solvedPuzzles?.[puzzleId],
					[gridSize]: solutionData,
				},
			},
		},
	};
}

/**
 * Get the highest grid size solved for a specific puzzle
 * Handles both signed-in users (Firestore) and signed-out users (localStorage)
 *
 * @param {Object} userData - User data object (null/undefined for signed-out users)
 * @param {number} puzzleId - Puzzle ID
 * @returns {number} Highest grid size solved (0, 3, or 4)
 */
export function getMaxGridSizeSolved(userData, puzzleId) {
	// Signed-in user: check Firestore data
	if (userData?.stats?.solvedPuzzles) {
		const solutions = userData.stats.solvedPuzzles[puzzleId];
		if (solutions) {
			const difficulties = Object.keys(solutions).map(Number);
			return Math.max(...difficulties, 0);
		}
	}

	// Signed-out user: check localStorage
	return getSignedOutMaxSolved(puzzleId);
}
