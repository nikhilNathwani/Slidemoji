import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FirestorePuzzle } from "../../utils/puzzleUtils";

export async function getFirestorePuzzleById(
	puzzleId: number,
): Promise<FirestorePuzzle | null> {
	try {
		const puzzleRef = doc(db, "puzzles", puzzleId.toString());
		const puzzleSnap = await getDoc(puzzleRef);

		if (puzzleSnap.exists()) {
			return puzzleSnap.data() as FirestorePuzzle;
		}
		return null;
	} catch (error) {
		console.error("[Firestore] Error getting puzzle:", error);
		throw error;
	}
}
