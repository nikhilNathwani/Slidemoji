/**
 * Game state management utilities
 * Handles saving game state to localStorage (signed out) or Firestore (signed in)
 */

// Get localStorage key for signed-out progress
const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Save signed-out progress to localStorage
const saveLocalProgress = (
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	isCompleted,
) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId, gridSize),
		JSON.stringify({
			isCompleted,
			grid,
			initialGrid: puzzleData[gridSize],
		}),
	);
};

/**
 * Save game progress after a move
 */
export function saveGameProgress({
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	user,
	saveMove, // Mutation function from useSaveGameState hook
}) {
	if (user) {
		// Signed in: save to Firestore
		saveMove({
			puzzleId: puzzleData.id,
			gridSize,
			grid,
		});
	} else {
		// Signed out: save to localStorage
		saveLocalProgress(puzzleId, gridSize, grid, puzzleData, false);
	}
}

/**
 * Save game completion
 */
export function saveGameCompletion({
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	user,
	saveCompletion, // Mutation function from useSaveCompletion hook
	updateCacheImmediately, // For instant trophy display
}) {
	if (user) {
		// Signed in: save to Firestore
		updateCacheImmediately();
		saveCompletion({
			puzzleId: puzzleData.id,
			gridSize,
			emoji: puzzleData.emoji,
			emojiName: puzzleData.emojiName,
		});
	} else {
		// Signed out: save to localStorage
		saveLocalProgress(puzzleId, gridSize, grid, puzzleData, true);
	}
}

/**
 * Save game restart
 */
export function saveGameRestart({
	gridSize,
	puzzleData,
	user,
	savePuzzleStart,
}) {
	if (user) {
		savePuzzleStart({
			puzzleId: puzzleData.id,
			gridSize,
			initialGrid: puzzleData[gridSize],
		});
	}
	// Note: Signed-out users don't persist restarts (ephemeral experience)
}
