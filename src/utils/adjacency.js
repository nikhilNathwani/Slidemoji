// Static adjacency maps for each board size
// Maps each position to a Set of adjacent positions

export const ADJACENCY_MAP_2X2 = {
	0: new Set([1, 2]),
	1: new Set([0, 3]),
	2: new Set([0, 3]),
	3: new Set([1, 2]),
};

export const ADJACENCY_MAP_3X3 = {
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

export const ADJACENCY_MAP_4X4 = {
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
export const ADJACENCY_MAPS = {
	2: ADJACENCY_MAP_2X2,
	3: ADJACENCY_MAP_3X3,
	4: ADJACENCY_MAP_4X4,
};

// Helper functions for readable call sites

/**
 * Check if two positions are adjacent on a board of given size
 * @param {number} index1 - First position index
 * @param {number} index2 - Second position index
 * @param {number} size - Board size (2, 3, or 4)
 * @returns {boolean} True if positions are adjacent
 */
export function isAdjacent(index1, index2, size) {
	return ADJACENCY_MAPS[size][index1].has(index2);
}

/**
 * Get all adjacent positions for a given position
 * @param {number} index - Position index
 * @param {number} size - Board size (2, 3, or 4)
 * @returns {number[]} Array of adjacent position indices
 */
export function getAdjacentIndices(index, size) {
	return Array.from(ADJACENCY_MAPS[size][index]);
}
