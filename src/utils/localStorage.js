/**
 * localStorage utilities for signed-out user progress
 *
 * Signed-out users have limited persistence:
 * - Completions (trophies) persist until next puzzle
 * - In-progress work is ephemeral (lost on refresh) to incentivize sign-in
 *
 * 3x3 only - no difficulty variations
 */

import { GRID_SIZE } from "../constants";

// Get localStorage key for signed-out progress (3x3 only)
export const getLocalStorageKey = (puzzleId) =>
	`signedOutProgress_${puzzleId}`;

// Read signed-out completion from localStorage
export const getLocalCompletion = (puzzleId) => {
	const key = getLocalStorageKey(puzzleId);
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

// Save signed-out completion to localStorage (just a flag, no grid state)
export const saveLocalCompletion = (puzzleId) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId),
		JSON.stringify({ isCompleted: true }),
	);
};

// Clear localStorage after migration
export const clearLocalProgress = (puzzleId) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId));
};

// Check if signed-out user completed this puzzle (returns GRID_SIZE if solved, 0 if not)
export const getSignedOutMaxSolved = (puzzleId) => {
	const completion = getLocalCompletion(puzzleId);
	return completion?.isCompleted ? GRID_SIZE : 0;
};
