/**
 * Game state management abstraction
 * Handles saving/loading game state from localStorage (signed out) or Firestore (signed in)
 */

// Get localStorage key for signed-out progress
const getLocalStorageKey = (puzzleId, gridSize) =>
	`signedOutProgress_${puzzleId}_${gridSize}`;

// Read signed-out progress from localStorage
const getLocalProgress = (puzzleId, gridSize) => {
	const key = getLocalStorageKey(puzzleId, gridSize);
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

// Clear localStorage after migration
const clearLocalProgress = (puzzleId, gridSize) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId, gridSize));
};

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
 * Initialize game state on mount
 * Handles migration from localStorage and determines initial grid
 * Returns: { initialGrid, isCompleted, shouldClearLocal }
 */
export function initializeGameState({
	puzzleId,
	gridSize,
	puzzleData,
	savedGame,
	user,
	mutations, // { savePuzzleStart, saveMove, saveCompletion }
}) {
	const localProgress = getLocalProgress(puzzleId, gridSize);

	// Helper: Check if savedGame is just the initial grid (no real progress)
	const isInitialGrid = (grid) => {
		if (!grid) return false;
		const initial = puzzleData[gridSize];
		return JSON.stringify(grid) === JSON.stringify(initial);
	};

	const hasFirestoreProgress = savedGame && !isInitialGrid(savedGame.grid);

	// Priority 1: Firestore saved game with actual progress (when signed in)
	if (hasFirestoreProgress) {
		// If there's also localStorage data from being signed out, migrate completions only
		if (localProgress && user) {
			const { isCompleted: wasCompleted } = localProgress;

			if (wasCompleted) {
				// Migrate completed puzzles (signing in should never lose a trophy)
				mutations.saveCompletion({
					puzzleId: puzzleData.id,
					gridSize,
					emoji: puzzleData.emoji,
					emojiName: puzzleData.emojiName,
				});
				console.log("[GAME] Migrated completion from localStorage");
			}
			// Note: In-progress localStorage data is discarded (Firestore state takes precedence)

			clearLocalProgress(puzzleId, gridSize);
		}

		return {
			initialGrid: savedGame.grid,
			isCompleted: false,
		};
	}

	// Priority 2: localStorage data (signed out progress, or signed in with no real Firestore progress)
	if (localProgress && user) {
		const { isCompleted: wasCompleted, grid, initialGrid } = localProgress;

		if (wasCompleted) {
			// Migrate completion
			mutations.saveCompletion({
				puzzleId: puzzleData.id,
				gridSize,
				emoji: puzzleData.emoji,
				emojiName: puzzleData.emojiName,
			});
			console.log("[GAME] Migrated completion from localStorage");

			clearLocalProgress(puzzleId, gridSize);
			return {
				initialGrid: grid,
				isCompleted: true,
			};
		}

		if (grid && initialGrid) {
			// Migrate in-progress work (better than initial Firestore state or no state)
			mutations.savePuzzleStart({
				puzzleId: puzzleData.id,
				gridSize,
				initialGrid,
			});
			mutations.saveMove({
				puzzleId: puzzleData.id,
				gridSize,
				grid,
			});
			console.log("[GAME] Migrated progress from localStorage");

			clearLocalProgress(puzzleId, gridSize);
			return {
				initialGrid: grid,
				isCompleted: false,
			};
		}
	}

	// Priority 3: Start fresh
	if (user) {
		mutations.savePuzzleStart({
			puzzleId: puzzleData.id,
			gridSize,
			initialGrid: puzzleData[gridSize],
		});
	}

	return {
		initialGrid: null, // null means "show initialGrid from puzzleData"
		isCompleted: false,
	};
}

/**
 * Save game progress after a move
 */
export function saveGameProgress({
	puzzleId,
	gridSize,
	grid,
	puzzleData,
	user,
	saveMoveToFirestore,
}) {
	if (user) {
		// Signed in: save to Firestore
		saveMoveToFirestore({
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
	saveCompletionToFirestore,
	updateCacheImmediately, // For instant trophy display
}) {
	if (user) {
		// Signed in: save to Firestore
		updateCacheImmediately();
		saveCompletionToFirestore({
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
