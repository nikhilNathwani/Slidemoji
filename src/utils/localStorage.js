/**
 * localStorage utilities for signed-out user progress
 *
 * Signed-out users have limited persistence:
 * - Completions (trophies) persist until next puzzle
 * - In-progress work is ephemeral (lost on refresh) to incentivize sign-in
 */

import { DIFFICULTIES } from "../constants";

// Get localStorage key for signed-out progress
export const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Read signed-out completion from localStorage
export const getLocalCompletion = (puzzleId, gridSize) => {
	const key = getLocalStorageKey(puzzleId, gridSize);
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

// Save signed-out completion to localStorage (just a flag, no grid state)
export const saveLocalCompletion = (puzzleId, gridSize) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId, gridSize),
		JSON.stringify({ isCompleted: true }),
	);
};

// Clear localStorage after migration
export const clearLocalProgress = (puzzleId, gridSize) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId, gridSize));
};

// Get max grid size completed by signed-out user for this puzzle
export const getSignedOutMaxSolved = (puzzleId) => {
	let maxSolved = 0;

	for (const { size } of DIFFICULTIES) {
		const completion = getLocalCompletion(puzzleId, size);
		if (completion?.isCompleted) {
			maxSolved = size;
		}
	}

	return maxSolved;
};
