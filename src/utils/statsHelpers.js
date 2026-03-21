/**
 * Add a puzzle solve to the user's solved puzzles (3x3 only)
 * Safely handles object creation
 *
 * @param {Object} userData - Current user data object
 * @param {number} puzzleId - Puzzle ID
 * @param {Object} solveData - Solve data to save (e.g., { completedAt, emoji, emojiName })
 * @returns {Object} Updated user data with new solve
 */
export function addPuzzleSolve(userData, puzzleId, solveData) {
	if (!userData || !userData.stats) return userData;

	return {
		...userData,
		stats: {
			...userData.stats,
			solvedPuzzles: {
				...userData.stats.solvedPuzzles,
				[puzzleId]: solveData,
			},
		},
	};
}
