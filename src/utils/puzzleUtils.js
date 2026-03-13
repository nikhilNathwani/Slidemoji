import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Convert board array from Firestore format to client format
 * Firestore uses 0 for gap, client uses null for gap
 * @param {Array} board - Board array from Firestore
 * @returns {Array} Board array with gaps as null
 */
export function convertBoardFromFirestore(board) {
	if (!board) return null;
	return board.map((v) => (v === 0 ? null : v));
}

/**
 * Convert puzzle data from Firestore format to client format
 * Firestore uses 0 for gap, client uses null for gap
 * @param {Object} puzzleData - Puzzle data from Firestore
 * @returns {Object} Puzzle data with converted board arrays
 */
export function convertPuzzleFromFirestore(puzzleData) {
	if (!puzzleData) return null;

	const converted = { ...puzzleData };

	if (converted.initialBoard3x3) {
		converted.initialBoard3x3 = convertBoardFromFirestore(
			converted.initialBoard3x3,
		);
	}
	if (converted.initialBoard4x4) {
		converted.initialBoard4x4 = convertBoardFromFirestore(
			converted.initialBoard4x4,
		);
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
		console.log(`Successfully saved ${puzzles.length} puzzles`);
	} catch (error) {
		console.error("Error batch saving puzzles:", error);
		throw error;
	}
}
