import {
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";
import { getUserData, createUserData } from "./firestore";

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
	try {
		const result = await signInWithPopup(auth, googleProvider);
		const user = result.user;

		// Check if user exists in Firestore, if not create
		const userData = await getUserData(user.uid);
		if (!userData) {
			await createUserData(user.uid, {
				email: user.email,
				displayName: user.displayName,
			});
		}

		return user;
	} catch (error) {
		console.error("Error signing in with Google:", error);
		throw error;
	}
}

/**
 * Sign out
 */
export async function signOut() {
	try {
		await firebaseSignOut(auth);
	} catch (error) {
		console.error("Error signing out:", error);
		throw error;
	}
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
	return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser() {
	return auth.currentUser;
}
