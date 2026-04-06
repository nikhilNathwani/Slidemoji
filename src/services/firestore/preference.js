import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function updateFirestorePreferences(userId, preferences) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};
		for (const [key, value] of Object.entries(preferences)) {
			updates[`preferences.${key}`] = value;
		}
		await updateDoc(userDocRef, updates);
	} catch (error) {
		console.error("[Firestore] Error updating preferences:", error);
		throw error;
	}
}
