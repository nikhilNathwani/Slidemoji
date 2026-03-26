/**
 * Add a puzzle solve to the user's solved puzzles
 * Safely handles object creation and tracks both difficulties separately
 *
 * @param {Object} userData - Current user data object
 * @param {number} puzzleId - Puzzle ID
 * @param {string} difficulty - Difficulty level (DIFFICULTY.NORMAL or DIFFICULTY.HARD)
 * @returns {Object} Updated user data with new solve
 */
export function addPuzzleSolve(userData, puzzleId, difficulty) {
	if (!userData || !userData.stats) return userData;

	const currentPuzzle = userData.stats.solvedPuzzles?.[puzzleId] || {};

	return {
		...userData,
		stats: {
			...userData.stats,
			solvedPuzzles: {
				...userData.stats.solvedPuzzles,
				[puzzleId]: {
					...currentPuzzle,
					[difficulty]: true,
				},
			},
		},
	};
}
