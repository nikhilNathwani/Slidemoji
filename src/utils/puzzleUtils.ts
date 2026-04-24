import emojiCalendar from "../../data/emoji_calendar.json";

// Update this to the actual launch date before shipping.
export const LAUNCH_DATE = "2026-04-24";

/**
 * Get the latest puzzle ID (today's puzzle number) based on start date.
 * Rolls over at local midnight by accounting for the user's timezone offset.
 */
export function getLatestPuzzleId(): number {
	const startDate = new Date(LAUNCH_DATE);
	const now = new Date();
	// Subtract timezone offset so the day boundary falls at local midnight,
	// not UTC midnight. getTimezoneOffset() is positive for zones behind UTC (e.g.
	// EST = +300) and negative for zones ahead (e.g. JST = -540).
	const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
	const daysSinceStart = Math.floor(
		(now.getTime() - tzOffsetMs - startDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % emojiCalendar.length) + 1;
}

/**
 * Formats a puzzle ID number into a display string.
 * E.g. 1 -> "#1", 24 -> "#24", 673 -> "#673"
 */
export function formatPuzzleId(
	puzzleId: number,
	{ includeHash = true }: { includeHash?: boolean } = {},
): string {
	return includeHash ? `#${puzzleId}` : String(puzzleId);
}

/** Shape of a puzzle document as it lives in Firestore. */
export interface FirestorePuzzle {
	emoji: string;
	emojiName: string;
	normal: number[];
	hard: number[];
}

/** Shape of puzzle data returned by usePuzzle. */
export interface PuzzleData {
	id: number;
	emoji: string;
	emojiName: string;
	initialGrids: {
		normal: number[];
		hard: number[];
	};
}
