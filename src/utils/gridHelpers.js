import {
	GRID_VIEWPORT_PADDING,
	GRID_RIDGE_BORDER,
	GRID_MAX_SIZE,
} from "../constants";

// Static adjacency maps for each grid size
// Maps each position to a Set of adjacent positions

const ADJACENCY_MAP_3X3 = {
	0: new Set([1, 3]),
	1: new Set([0, 2, 4]),
	2: new Set([1, 5]),
	3: new Set([0, 4, 6]),
	4: new Set([1, 3, 5, 7]),
	5: new Set([2, 4, 8]),
	6: new Set([3, 7]),
	7: new Set([4, 6, 8]),
	8: new Set([5, 7]),
};

const ADJACENCY_MAP_4X4 = {
	0: new Set([1, 4]),
	1: new Set([0, 2, 5]),
	2: new Set([1, 3, 6]),
	3: new Set([2, 7]),
	4: new Set([0, 5, 8]),
	5: new Set([1, 4, 6, 9]),
	6: new Set([2, 5, 7, 10]),
	7: new Set([3, 6, 11]),
	8: new Set([4, 9, 12]),
	9: new Set([5, 8, 10, 13]),
	10: new Set([6, 9, 11, 14]),
	11: new Set([7, 10, 15]),
	12: new Set([8, 13]),
	13: new Set([9, 12, 14]),
	14: new Set([10, 13, 15]),
	15: new Set([11, 14]),
};

// Map from size to adjacency map
const ADJACENCY_MAPS = {
	3: ADJACENCY_MAP_3X3,
	4: ADJACENCY_MAP_4X4,
};

/**
 * Check if two positions are adjacent on a grid of given size
 * @param {number} index1 - First position index
 * @param {number} index2 - Second position index
 * @param {number} size - Grid size (3, or 4)
 * @returns {boolean} True if positions are adjacent
 */
export function isAdjacent(size, index1, index2) {
	if (!(size in ADJACENCY_MAPS)) {
		throw new Error(`Invalid grid size: ${size}`);
	}
	if (typeof index1 !== "number" || index1 < 0 || index1 >= size * size) {
		throw new Error(`Invalid size-${size} grid index: ${index1}`);
	}
	return ADJACENCY_MAPS[size][index1].has(index2);
}

/**
 * Get all adjacent positions for a given position
 * @param {number} index - Position index
 * @param {number} size - Grid size (2, 3, or 4)
 * @returns {number[]} Array of adjacent position indices
 */
function getAdjacentIndices(index, size) {
	if (!(size in ADJACENCY_MAPS)) {
		throw new Error(`Invalid grid size: ${size}`);
	}
	if (typeof index !== "number" || index < 0 || index >= size * size) {
		throw new Error(`Invalid size-${size} grid index: ${index}`);
	}
	return Array.from(ADJACENCY_MAPS[size][index]);
}

/**
 * Calculate responsive grid size based on viewport
 * @param {number} gridSize - Grid size (2, 3, or 4)
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
 * @param {number} size - Grid size (2, 3, or 4)
 * @returns {Array} Array of tile values with 0 as last element
 */
export function getSolvedState(size) {
	return [...Array(size * size - 1)].map((_, i) => i + 1).concat(0);
}

/**
 * Find the index of the gap tile (0) in the tiles array
 * @param {Array} tiles - Array of tile values
 * @returns {number} Index of the gap
 */
export function getGapIndex(tiles) {
	return tiles.indexOf(0);
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
 * Grid is solved if elements are monotonically increasing with gap (0) at the end
 * @param {Array} tiles - Current tiles array
 * @returns {boolean} True if grid is solved
 */
export function checkWin(tiles) {
	if (!Array.isArray(tiles) || tiles.length === 0) return false;

	// Gap must be in the last position
	if (tiles[tiles.length - 1] !== 0) return false;

	// All other elements must be strictly monotonically increasing (1, 2, 3, ...)
	for (let i = 0; i < tiles.length - 1; i++) {
		if (tiles[i] !== i + 1) return false;
	}

	return true;
}

/**
 * Check if two grids are identical (element-by-element comparison)
 * @param {Array|null|undefined} left - First grid
 * @param {Array|null|undefined} right - Second grid
 * @returns {boolean} True if both are arrays with identical contents
 */
export function areGridsEqual(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;
	return left.every((val, i) => val === right[i]);
}

/**
 * Generate a scrambled puzzle by making random valid moves
 * Always ensures the gap ends up in the bottom-right corner
 * @param {number} size - Grid size (2, 3, or 4)
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
		tiles[randomMoveIndex] = 0;
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
		tiles[nextIndex] = 0;
		tiles[gapIndex] = tileValue;
		gapIndex = nextIndex;
	}

	return tiles;
}

/**
 * Get tile index from arrow key direction for keyboard controls
 * @param {number} gapIndex - Current gap index
 * @param {string} direction - Arrow key direction
 * @param {number} size - Grid size (2, 3, or 4)
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
