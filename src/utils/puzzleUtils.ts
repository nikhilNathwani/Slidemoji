/**
 * Get the latest puzzle ID (today's puzzle number) based on start date.
 * Rolls over at local midnight by accounting for the user's timezone offset.
 */
export function getLatestPuzzleId(): number {
	const startDate = new Date("2026-01-01"); // First puzzle date (UTC midnight)
	const now = new Date();
	// Subtract timezone offset so the day boundary falls at local midnight,
	// not UTC midnight. getTimezoneOffset() is positive for zones behind UTC (e.g.
	// EST = +300) and negative for zones ahead (e.g. JST = -540).
	const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
	const daysSinceStart = Math.floor(
		(now.getTime() - tzOffsetMs - startDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1; // Cycle after 365 puzzles
}

/**
 * Formats a puzzle ID number into a display string.
 * E.g. 1 -> "#001", 24 -> "#024", 673 -> "#673"
 */
export function formatPuzzleId(
	puzzleId: number,
	{ includeHash = true }: { includeHash?: boolean } = {},
): string {
	const padded = String(puzzleId).padStart(3, "0");
	return includeHash ? `#${padded}` : padded;
}

interface PuzzleMetadata {
	id?: number;
	emoji?: string;
	emojiName?: string;
	normal?: number[] | null;
	hard?: number[] | null;
	[key: string]: unknown;
}

/**
 * Convert puzzle data from Firestore format to client format.
 * Firestore and client both use 0 for gap.
 */
export function convertPuzzleFromFirestore(
	puzzleMetadata: PuzzleMetadata | null | undefined,
	gridSize = 3,
): PuzzleMetadata | null {
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
