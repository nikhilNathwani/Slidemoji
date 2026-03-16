import { getAdjacentIndices } from "./adjacency";
import {
	GRID_VIEWPORT_PADDING,
	GRID_RIDGE_BORDER,
	GRID_MAX_SIZE,
} from "../constants";

/**
 * Calculate responsive grid size based on viewport
 * @param {number} gridSize - Grid size (3 or 4)
 * @returns {number} Grid size in pixels
 */
export function calcBoardSizePx(gridSize) {
	const maxContentSize = Math.min(
		window.innerWidth - GRID_VIEWPORT_PADDING - GRID_RIDGE_BORDER,
		GRID_MAX_SIZE,
	);
	// Ensure content area is divisible by grid size for perfect tile sizing
	return Math.floor(maxContentSize / gridSize) * gridSize;
}

/**
 * Get the solved state for a grid of given size
 * @param {number} size - Grid size (3 or 4)
 * @returns {Array} Array of tile values with null as last element
 */
export function getSolvedState(size) {
	return [...Array(size * size - 1)].map((_, i) => i + 1).concat(null);
}

/**
 * Find the index of the gap (null tile) in the tiles array
 * @param {Array} tiles - Array of tile values
 * @returns {number} Index of the gap
 */
export function getGapIndex(tiles) {
	return tiles.indexOf(null);
}

/**
 * Swap two tiles in the array (immutably)
 * @param {Array} tiles - Array of tile values
 * @param {number} index1 - Index of first tile
 * @param {number} index2 - Index of second tile
 * @returns {Array} New array with swapped tiles
 */
export function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles];
	[newTiles[index1], newTiles[index2]] = [tiles[index2], tiles[index1]];
	return newTiles;
}

/**
 * Check if the current grid state is solved
 * @param {Array} tiles - Array of tile values
 * @param {Array} solvedState - The solved state to compare against
 * @returns {boolean} True if grid is solved
 */
export function checkWin(tiles, solvedState) {
	return tiles.every((tile, index) => tile === solvedState[index]);
}

/**
 * Generate a scrambled puzzle by making random valid moves
 * Always ensures the gap ends up in the bottom-right corner
 * @param {number} size - Grid size (3 or 4)
 * @param {number} numMoves - Number of random moves to make (default 100)
 * @returns {Array} Scrambled tiles array with gap in bottom-right
 */
export function scramblePuzzle(size, numMoves = 100) {
	let tiles = [...getSolvedState(size)];
	let gapIndex = getGapIndex(tiles);
	const bottomRightIndex = size * size - 1;

	// Start with gap in bottom-right where we want it to end
	// We'll do this by moving from solved state
	for (let i = 0; i < numMoves; i++) {
		const validMoves = getAdjacentIndices(gapIndex, size);
		const randomMoveIndex =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		// Explicitly swap gap with random adjacent tile
		const tileValue = tiles[randomMoveIndex];
		tiles[randomMoveIndex] = null;
		tiles[gapIndex] = tileValue;
		gapIndex = randomMoveIndex;
	}

	// If gap is not in bottom-right, move it there
	// by doing a series of moves to get it to the corner
	while (gapIndex !== bottomRightIndex) {
		const gapRow = Math.floor(gapIndex / size);
		const gapCol = gapIndex % size;
		const targetRow = size - 1;
		const targetCol = size - 1;

		let nextIndex;

		// Prioritize moving down, then right
		if (gapRow < targetRow) {
			// Move gap down (swap with tile below)
			nextIndex = gapIndex + size;
		} else if (gapCol < targetCol) {
			// Move gap right (swap with tile to the right)
			nextIndex = gapIndex + 1;
		} else {
			// Should not reach here, but break to prevent infinite loop
			break;
		}

		// Swap
		const tileValue = tiles[nextIndex];
		tiles[nextIndex] = null;
		tiles[gapIndex] = tileValue;
		gapIndex = nextIndex;
	}

	return tiles;
}

/**
 * Get tile index from arrow key direction for keyboard controls
 * @param {number} gapIndex - Current gap index
 * @param {string} direction - Arrow key direction
 * @param {number} size - Grid size (3 or 4)
 * @returns {number|null} Tile index that should move, or null if invalid
 */
export function getTileIndexFromDirection(gapIndex, direction, size) {
	const gapRow = Math.floor(gapIndex / size);
	const gapCol = gapIndex % size;

	const directionMap = {
		ArrowUp: { row: gapRow + 1, col: gapCol },
		ArrowDown: { row: gapRow - 1, col: gapCol },
		ArrowLeft: { row: gapRow, col: gapCol + 1 },
		ArrowRight: { row: gapRow, col: gapCol - 1 },
	};

	const target = directionMap[direction];
	if (!target) return null;

	if (
		target.row < 0 ||
		target.row >= size ||
		target.col < 0 ||
		target.col >= size
	) {
		return null;
	}

	return target.row * size + target.col;
}
