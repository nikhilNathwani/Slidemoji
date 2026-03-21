/**
 * Add a puzzle solve to the user's solved puzzles (3x3 only)
 * Safely handles object creation
 *
 * @param {Object} userData - Current user data object
 * @param {number} puzzleId - Puzzle ID
 * @returns {Object} Updated user data with new solve
 */
export function addPuzzleSolve(userData, puzzleId) {
	if (!userData || !userData.stats) return userData;

	return {
		...userData,
		stats: {
			...userData.stats,
			solvedPuzzles: {
				...userData.stats.solvedPuzzles,
				[puzzleId]: true,
			},
		},
	};
}
