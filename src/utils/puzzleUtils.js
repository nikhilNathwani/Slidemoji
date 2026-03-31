/**
 * Get the latest puzzle ID (today's puzzle number) based on start date
 * Cycles back to 1 after 365 puzzles
 * @returns {number} Puzzle ID (1-365)
 */
export function getLatestPuzzleId() {
	const startDate = new Date("2026-01-01"); // First puzzle date
	const today = new Date();
	const daysSinceStart = Math.floor(
		(today - startDate) / (1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1; // Cycle after 365 puzzles
}

/**
 * Converts puzzle ID (integer) into formated string
 * E.g. 1 -> "#001", 24 -> "#024", 673 -> "#673"
 * @returns {number} Puzzle ID (1-365)
 */
export function getPaddedString(puzzleId) {
	return `#${String(puzzleId).padStart(3, "0")}`;
}

/**
 * Convert puzzle data from Firestore format to client format
 * Firestore and client both use 0 for gap
 *
 * Uses normalized schema (puzzle.normal/puzzle.hard)
 *
 * @param {Object} puzzleMetadata - Puzzle data from Firestore
 * @param {number} gridSize - Grid size (3 or 4)
 * @returns {Object} Puzzle data with converted grid array for the specified size
 */
export function convertPuzzleFromFirestore(puzzleMetadata, gridSize = 3) {
	if (!puzzleMetadata) return null;

	const converted = { ...puzzleMetadata };

	const normalGrid = converted.normal;
	const hardGrid = converted.hard;

	if (normalGrid || hardGrid) {
		if (gridSize === 4) {
			converted.initialGrid = hardGrid || normalGrid;
		} else {
			converted.initialGrid = normalGrid || hardGrid;
		}

		// Keep these for callers that expect explicit difficulty grids
		converted.normal = normalGrid || null;
		converted.hard = hardGrid || null;
		converted.grid3x3 = normalGrid || null;
		converted.grid4x4 = hardGrid || null;
	}
	return converted;
}
