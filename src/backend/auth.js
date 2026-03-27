/**
 * Authentication Module
 *
 * Handles Google Sign-In and user session management.
 * When a user signs in for the first time, this module automatically
 * creates their user document with default preferences and stats.
 */

import {
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import {
	getUserDataFromFirestore,
	createUserDataInFirestore,
} from "../storage";

// Google OAuth provider for Firebase Authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google using a popup window
 *
 * Flow:
 * 1. Opens Google OAuth popup
 * 2. User selects their Google account
 * 3. Firebase authenticates and returns user object
 * 4. Check if user exists in Firestore database
 * 5. If new user, create their Firestore document with default data
 *
 * @returns {Promise<User>} Firebase user object
 * @throws {Error} If sign-in fails or popup is blocked
 */
export async function signInWithGoogle() {
	try {
		// Open Google sign-in popup
		const result = await signInWithPopup(auth, googleProvider);
		const user = result.user;

		// First-time users: Create Firestore document with default preferences and stats
		const userData = await getUserDataFromFirestore(user.uid);
		if (!userData) {
			await createUserDataInFirestore(user.uid, {
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
 * Sign out the current user
 *
 * Clears Firebase auth session. The onAuthStateChanged listener
 * in AuthProvider will automatically update the app's user state.
 *
 * @throws {Error} If sign-out fails
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
 * Listen to authentication state changes
 *
 * Firebase automatically detects when users sign in/out, even across tabs.
 * This listener is used by AuthProvider to keep app state in sync.
 *
 * @param {Function} callback - Called with user object (or null) when auth state changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export function onAuthChange(callback) {
	return onAuthStateChanged(auth, callback);
}

/**
 * Get the currently signed-in user (synchronous)
 *
 * @returns {User|null} Current Firebase user or null if not signed in
 */
export function getCurrentUser() {
	return auth.currentUser;
}
