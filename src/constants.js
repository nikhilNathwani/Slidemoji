// Difficulty constants (used throughout codebase)
export const DIFFICULTY = {
	NORMAL: "normal",
	HARD: "hard",
};

// Difficulty to grid size mapping
const DIFFICULTY_SIZES = {
	[DIFFICULTY.NORMAL]: 3,
	[DIFFICULTY.HARD]: 4,
};

// Helper to get grid size from difficulty
export function getDifficultySize(difficulty) {
	return DIFFICULTY_SIZES[difficulty] || 3;
}

/**
 * Determine difficulty from grid array length
 * Useful when you have a grid and need to know its difficulty
 * @param {Array} grid - Grid array
 * @returns {string} DIFFICULTY.NORMAL or DIFFICULTY.HARD
 */
export function getDifficultyFromGrid(grid) {
	if (!grid || !Array.isArray(grid)) return DIFFICULTY.NORMAL;
	const length = grid.length;
	if (length === 16) return DIFFICULTY.HARD; // 4x4
	if (length === 9) return DIFFICULTY.NORMAL; // 3x3
	return DIFFICULTY.NORMAL; // default
}

// Difficulty levels for UI (dropdowns/buttons)
export const DIFFICULTIES = [
	{ value: DIFFICULTY.NORMAL, size: 3, label: "Normal", display: "3×3" },
	{ value: DIFFICULTY.HARD, size: 4, label: "Hard", display: "4×4" },
];

export const DEFAULT_DIFFICULTY = DIFFICULTY.NORMAL;
export const DEFAULT_GRID_SIZE = 3;

// Grid layout (used by gridHelpers.js)
export const GRID_VIEWPORT_PADDING = 40; // Padding on each side of viewport
export const GRID_RIDGE_BORDER = 16; // Ridge border width (8px each side)
export const GRID_MAX_SIZE = 420; // Max grid content size in px (reduced for better vertical centering)
