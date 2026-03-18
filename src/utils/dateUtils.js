/**
 * Date utilities for streak calculation and puzzle management
 */

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getTodaysDate() {
	const now = new Date();
	return now.toISOString().split("T")[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getYesterdaysDate() {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return yesterday.toISOString().split("T")[0];
}

/**
 * Get the current puzzle ID (today's puzzle number) based on start date
 * Cycles back to 1 after 365 puzzles
 * @returns {number} Puzzle ID (1-365)
 */
export function getCurrentPuzzleId() {
	const startDate = new Date("2026-01-01"); // First puzzle date
	const today = new Date();
	const daysSinceStart = Math.floor(
		(today - startDate) / (1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1; // Cycle after 365 puzzles
}

/**
 * Get puzzle number for a specific date
 * @param {Date} date - The date to get puzzle number for
 * @returns {number} Puzzle number (1-365)
 */
export function getPuzzleNumberForDate(date) {
	const startDate = new Date("2026-01-01");
	const daysSinceStart = Math.floor(
		(date - startDate) / (1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1;
}
