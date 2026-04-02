import {
	doc,
	getDoc,
	serverTimestamp,
	runTransaction,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

function isTransientAuthTransitionPermissionError(userId, error) {
	return (
		error?.code === "permission-denied" && auth.currentUser?.uid !== userId
	);
}

export function subscribeToFirestoreUserData(userId, { onData, onError }) {
	if (!userId) {
		return () => {};
	}

	const userDocRef = doc(db, "users", userId);
	return onSnapshot(
		userDocRef,
		(docSnap) => {
			onData(docSnap.exists() ? docSnap.data() : null);
		},
		(error) => {
			if (isTransientAuthTransitionPermissionError(userId, error)) {
				return;
			}
			onError?.(error);
		},
	);
}

export async function getFirestoreUserData(userId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const userDoc = await getDoc(userDocRef);
		return userDoc.exists() ? userDoc.data() : null;
	} catch (error) {
		console.error("[Firestore] Error getting user data:", error);
		throw error;
	}
}

// Dev-only: toggle isPremium on the current user doc for local testing
export async function resetPremiumForDev(userId, isPremium) {
	if (!userId) throw new Error("User ID is required");
	const userDocRef = doc(db, "users", userId);
	await updateDoc(userDocRef, { isPremium });
}

export async function syncFirestoreUserData(firebaseUser) {
	if (!firebaseUser?.uid) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", firebaseUser.uid);

		await runTransaction(db, async (transaction) => {
			const userDoc = await transaction.get(userDocRef);

			if (!userDoc.exists()) {
				transaction.set(userDocRef, {
					uid: firebaseUser.uid,
					email: firebaseUser.email || null,
					displayName: firebaseUser.displayName || null,
					photoURL: firebaseUser.photoURL || null,
					isAnonymous:
						firebaseUser.isAnonymous === false ? false : true,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
					preferences: {
						darkMode: false,
						soundEnabled: true,
					},
					gameState: null,
					isPremium: false,
				});
				return;
			}

			if (firebaseUser.isAnonymous === false) {
				transaction.update(userDocRef, {
					email: firebaseUser.email || null,
					displayName: firebaseUser.displayName || null,
					photoURL: firebaseUser.photoURL || null,
					isAnonymous: false,
					updatedAt: serverTimestamp(),
				});
			}
		});
	} catch (error) {
		console.error("[Firestore] Error syncing user data:", error);
		throw error;
	}
}
