import {
	doc,
	getDoc,
	serverTimestamp,
	runTransaction,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db, COLLECTIONS } from "../firebaseConfig";

/** The normalised, in-memory state for a single puzzle (both grids guaranteed present). */
export interface GameState {
	normal: number[];
	hard: number[];
	currentDifficulty: string;
	/** Set to true when a puzzle is won (including via fuzzy win). Used by
	 *  useSolvedGames to detect wins that don't pass the strict checkWin test. */
	normalSolved?: boolean;
	hardSolved?: boolean;
}

/** Firestore app-data document for a user. Auth identity fields live in UserObject via useAuth(). */
export interface UserDoc {
	isPremium: boolean;
	/** Keys are puzzle IDs as strings (Firestore always serializes map keys as strings).
	 *  Values are Partial<GameState> because a save can be incomplete
	 *  (e.g. only currentDifficulty written on a difficulty switch before any moves). */
	savedGames: Record<string, Partial<GameState>> | null;
	preferences: {
		darkMode: boolean;
		soundEnabled: boolean;
		showNumbers?: boolean;
	};
	createdAt?: unknown; // Firestore server timestamp — written by app, never read
	updatedAt?: unknown;
}

export function subscribeToFirestoreUserData(
	userId: string,
	{
		onData,
		onError,
	}: {
		onData: (data: UserDoc | null) => void;
		onError?: (error: Error) => void;
	},
): () => void {
	if (!userId) {
		return () => {};
	}

	const userDocRef = doc(db, COLLECTIONS.USERS, userId);
	return onSnapshot(
		userDocRef,
		(docSnap) => {
			onData(docSnap.exists() ? (docSnap.data() as UserDoc) : null);
		},
		(error) => {
			if (
				error?.code === "permission-denied" &&
				auth.currentUser?.uid !== userId
			) {
				return;
			}
			onError?.(error);
		},
	);
}

export async function getFirestoreUserData(
	userId: string,
): Promise<UserDoc | null> {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, COLLECTIONS.USERS, userId);
		const userDoc = await getDoc(userDocRef);
		return userDoc.exists() ? (userDoc.data() as UserDoc) : null;
	} catch (error) {
		console.error("[Firestore] Error getting user data:", error);
		throw error;
	}
}

// Dev-only: toggle isPremium on the current user doc for local testing
export async function resetPremiumForDev(
	userId: string,
	isPremium: boolean,
): Promise<void> {
	if (!userId) throw new Error("User ID is required");
	const userDocRef = doc(db, COLLECTIONS.USERS, userId);
	await updateDoc(userDocRef, { isPremium });
}

// Read a preference value saved by usePreference's setPreference so it can be
// seeded into a new user doc, preserving settings across sign-out.
function readLocalPref<T>(key: string, fallback: T): T {
	try {
		const v = localStorage.getItem(`pref_${key}`);
		return v !== null ? (JSON.parse(v) as T) : fallback;
	} catch {
		return fallback;
	}
}

export async function syncFirestoreUserData(firebaseUser: User): Promise<void> {
	if (!firebaseUser?.uid) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);

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
						darkMode: readLocalPref("darkMode", false),
						soundEnabled: readLocalPref("soundEnabled", false),
						showNumbers: readLocalPref("showNumbers", true),
					},
					savedGames: null,
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
