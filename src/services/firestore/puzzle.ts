import {
	doc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
	documentId,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";
import { FirestorePuzzle } from "../../utils/puzzleUtils";

export async function getFirestorePuzzleById(
	puzzleId: number,
): Promise<FirestorePuzzle | null> {
	try {
		const puzzleRef = doc(db, COLLECTIONS.PUZZLES, puzzleId.toString());
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

export async function getFirestorePuzzlesByIds(
	puzzleIds: number[],
): Promise<Map<number, FirestorePuzzle>> {
	if (puzzleIds.length === 0) return new Map();
	const stringIds = puzzleIds.map((id) => id.toString());
	const q = query(
		collection(db, COLLECTIONS.PUZZLES),
		where(documentId(), "in", stringIds),
	);
	const snap = await getDocs(q);
	const result = new Map<number, FirestorePuzzle>();
	snap.forEach((docSnap) => {
		result.set(parseInt(docSnap.id), docSnap.data() as FirestorePuzzle);
	});
	return result;
}
