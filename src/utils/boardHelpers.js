import { getAdjacentIndices } from "./adjacency";

/**
 * Get the solved state for a board of given size
 * @param {number} size - Board size (3 or 4)
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
 * @param {number} index1 - First tile index
 * @param {number} index2 - Second tile index
 * @returns {Array} New array with swapped tiles
 */
export function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles];
	[newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
	return newTiles;
}

/**
 * Check if the current board state is solved
 * @param {Array} tiles - Array of tile values
 * @param {Array} solvedState - The solved state to compare against
 * @returns {boolean} True if board is solved
 */
export function checkWin(tiles, solvedState) {
	return tiles.every((tile, index) => tile === solvedState[index]);
}

/**
 * Generate a scrambled puzzle by making random valid moves
 * @param {number} size - Board size (3 or 4)
 * @param {number} numMoves - Number of random moves to make (default 100)
 * @returns {Array} Scrambled tiles array
 */
export function scramblePuzzle(size, numMoves = 100) {
	let tiles = [...getSolvedState(size)];
	let gapIndex = getGapIndex(tiles);

	for (let i = 0; i < numMoves; i++) {
		const validMoves = getAdjacentIndices(gapIndex, size);
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];
		[tiles[gapIndex], tiles[randomMove]] = [
			tiles[randomMove],
			tiles[gapIndex],
		];
		gapIndex = randomMove;
	}

	return tiles;
}

/**
 * Calculate tile position based on index
 * @param {number} index - Tile index in the array
 * @param {number} size - Board size (3 or 4)
 * @param {number} tileSizePx - Size of each tile in pixels
 * @returns {Object} Object with x and y coordinates
 */
export function getTilePosition(index, size, tileSizePx) {
	const row = Math.floor(index / size);
	const col = index % size;
	return {
		x: col * tileSizePx,
		y: row * tileSizePx,
	};
}

/**
 * Get tile index from arrow key direction for keyboard controls
 * @param {number} gapIndex - Current gap index
 * @param {string} direction - Arrow key direction
 * @param {number} size - Board size (3 or 4)
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
