import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function getFirestorePuzzleById(puzzleId) {
	try {
		const puzzleRef = doc(db, "puzzles", puzzleId.toString());
		const puzzleSnap = await getDoc(puzzleRef);

		if (puzzleSnap.exists()) {
			return puzzleSnap.data();
		}
		return null;
	} catch (error) {
		console.error("[Firestore] Error getting puzzle:", error);
		throw error;
	}
}
