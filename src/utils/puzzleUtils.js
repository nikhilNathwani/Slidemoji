import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

/**
 * Get the latest puzzle ID (today's puzzle number) based on start date
 * Cycles back to 1 after 365 puzzles
 * @returns {number} Puzzle ID (1-365)
 */
export function getLatestPuzzleId() {
	const startDate = new Date("2026-01-01"); // First puzzle date
	const today = new Date();
	const daysSinceStart = Math.floor(
		(today - startDate) / (1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1; // Cycle after 365 puzzles
}

/**
 * Convert grid array from storage format (0 for gap) to client format (null for gap)
 * Works for both Firestore and localStorage (both use 0 for gap now)
 * @param {Array} grid - Grid array from storage
 * @returns {Array|null} Grid array with gaps as null, or null if invalid input
 */
export function convertGridFromStorage(grid) {
	if (!grid || !Array.isArray(grid)) return null;
	return grid.map((v) => (v === 0 ? null : v));
}

/**
 * Convert puzzle data from Firestore format to client format
 * Firestore uses 0 for gap, client uses null for gap
 *
 * Handles both old schema (puzzle.3/puzzle.4) and new schema (puzzle.initialGrid)
 *
 * @param {Object} puzzleMetadata - Puzzle data from Firestore
 * @param {number} gridSize - Grid size (3 or 4)
 * @returns {Object} Puzzle data with converted grid array for the specified size
 */
export function convertPuzzleFromFirestore(puzzleMetadata, gridSize = 3) {
	if (!puzzleMetadata) return null;

	const converted = { ...puzzleMetadata };

	// Handle schema with separate 3x3 and 4x4 grids
	if (converted["3"] || converted["4"]) {
		// Load the grid for the requested size
		const gridKey = gridSize.toString();
		if (converted[gridKey]) {
			converted.initialGrid = convertGridFromStorage(converted[gridKey]);
		} else {
			// Fallback to 3x3 if requested size doesn't exist
			converted.initialGrid = convertGridFromStorage(converted["3"]);
		}
		// Keep original fields for reference
		converted.grid3x3 = converted["3"];
		converted.grid4x4 = converted["4"];
	}
	// Handle new schema: puzzle.initialGrid (backward compatibility)
	else if (converted.initialGrid) {
		converted.initialGrid = convertGridFromStorage(converted.initialGrid);
	}

	return converted;
}

/**
 * Get puzzle data by ID
 * @param {number} puzzleId - The puzzle number
 * @returns {Promise<Object|null>} Puzzle data or null if not found
 */
export async function getPuzzleById(puzzleId) {
	try {
		const puzzleRef = doc(db, "puzzles", puzzleId.toString());
		const puzzleSnap = await getDoc(puzzleRef);

		if (puzzleSnap.exists()) {
			return puzzleSnap.data();
		}
		return null;
	} catch (error) {
		console.error("Error getting puzzle:", error);
		throw error;
	}
}

/**
 * Get all puzzles
 * @returns {Promise<Array>} Array of puzzle data
 */
export async function getAllPuzzles() {
	try {
		const puzzlesRef = collection(db, "puzzles");
		const querySnapshot = await getDocs(puzzlesRef);

		const puzzles = [];
		querySnapshot.forEach((doc) => {
			puzzles.push({ id: doc.id, ...doc.data() });
		});

		return puzzles.sort((a, b) => a.id - b.id);
	} catch (error) {
		console.error("Error getting all puzzles:", error);
		throw error;
	}
}

/**
 * Save puzzle to Firestore (admin function)
 * @param {Object} puzzleData - Puzzle data to save
 */
export async function savePuzzle(puzzleData) {
	try {
		const puzzleRef = doc(db, "puzzles", puzzleData.id.toString());
		await setDoc(puzzleRef, puzzleData);
	} catch (error) {
		console.error("Error saving puzzle:", error);
		throw error;
	}
}

/**
 * Batch save puzzles to Firestore (admin function)
 * @param {Array} puzzles - Array of puzzle data
 */
export async function batchSavePuzzles(puzzles) {
	try {
		const promises = puzzles.map((puzzle) => savePuzzle(puzzle));
		await Promise.all(promises);
	} catch (error) {
		console.error("Error batch saving puzzles:", error);
		throw error;
	}
}

/**
 * Extract solved puzzles from user data
 * Returns an object with puzzleId as key and solved difficulties as value
 * Example: { 87: { normal: true, hard: true }, 86: { normal: true } }
 *
 * @param {Object} userData - User data from Firestore
 * @returns {Object} Solved puzzles object
 */
export function getSolvedPuzzlesFromUserData(userData) {
	if (!userData?.gameState) return {};

	const solvedPuzzles = {};

	// Iterate through all puzzles in gameState
	for (const [puzzleId, puzzleData] of Object.entries(userData.gameState)) {
		if (puzzleData?.solved) {
			solvedPuzzles[puzzleId] = puzzleData.solved;
		}
	}

	return solvedPuzzles;
}
