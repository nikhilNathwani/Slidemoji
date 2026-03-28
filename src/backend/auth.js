/**
 * Authentication Module
 *
 * Handles Firebase Anonymous Auth + Google Sign-In
 *
 * Flow:
 * 1. Anonymous users are auto-signed in on first visit (get temporary user ID)
 * 2. Their data saves to Firestore with offline IndexedDB persistence
 * 3. When they click "Sign in with Google", we link the anonymous account
 *    with their Google account using Firebase's linkWithCredential
 * 4. All their data is automatically preserved (no migration needed!)
 *
 * This eliminates dual storage (localStorage vs Firestore) - everyone uses Firestore.
 */

import {
	GoogleAuthProvider,
	signInAnonymously,
	signInWithPopup,
	linkWithCredential,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import {
	getFirestoreUserData,
	createFirestoreUserData,
	updateFirestoreUserProfile,
} from "./firestore";

// Google OAuth provider for Firebase Authentication
const googleProvider = new GoogleAuthProvider();

/**
 * Check if user is signed in with Google (not anonymous)
 * @param {Object} user - Firebase user object
 * @returns {boolean} True if signed in with Google, false if anonymous or null
 */
export function isSignedIn(user) {
	return user?.isAnonymous === false;
}

/**
 * Sign in anonymously (called automatically on app load)
 * Creates a temporary Firebase user ID so anonymous users can save to Firestore
 * @returns {Promise<User>} Anonymous Firebase user
 */
export async function signInAnonymouslyIfNeeded() {
	// If already signed in (anonymous or Google), do nothing
	if (auth.currentUser) {
		return auth.currentUser;
	}

	try {
		const result = await signInAnonymously(auth);
		console.log("[Auth] Signed in anonymously:", result.user.uid);

		// Create user document with default data for anonymous users
		const userData = await getFirestoreUserData(result.user.uid);
		if (!userData) {
			await createFirestoreUserData(result.user.uid, {
				isAnonymous: true,
			});
		}

		return result.user;
	} catch (error) {
		console.error("[Auth] Error signing in anonymously:", error);
		throw error;
	}
}

/**
 * Sign in with Google (upgrades anonymous account if applicable)
 *
 * Flow:
 * 1. If user is currently anonymous, link their Google account to preserve data
 * 2. If user is not signed in or already has Google account, regular sign-in
 * 3. Update Firestore document with Google profile info
 *
 * Firebase automatically preserves all data when linking anonymous → Google
 *
 * @returns {Promise<User>} Firebase user object
 * @throws {Error} If sign-in fails or popup is blocked
 */
export async function signInWithGoogle() {
	const currentUser = auth.currentUser; // Get this at the top so it's in scope for catch block

	try {
		// Case 1: Upgrading anonymous account to Google account
		if (currentUser && currentUser.isAnonymous) {
			console.log("[Auth] Upgrading anonymous account to Google");

			// Get Google credential from popup
			const result = await signInWithPopup(auth, googleProvider);
			const credential = GoogleAuthProvider.credentialFromResult(result);

			// Link the Google credential to the anonymous account
			// This preserves all data (user ID stays the same!)
			const linkedUser = await linkWithCredential(
				currentUser,
				credential,
			);

			// Update Firestore document with Google profile info
			await updateFirestoreUserProfile(linkedUser.user.uid, {
				email: linkedUser.user.email,
				displayName: linkedUser.user.displayName,
				photoURL: linkedUser.user.photoURL,
				isAnonymous: false,
			});

			console.log(
				"[Auth] Successfully upgraded to Google:",
				linkedUser.user.uid,
			);
			return linkedUser.user;
		}

		// Case 2: Regular Google sign-in (not anonymous)
		const result = await signInWithPopup(auth, googleProvider);
		const user = result.user;

		// First-time Google users: Create Firestore document
		const userData = await getFirestoreUserData(user.uid);
		if (!userData) {
			await createFirestoreUserData(user.uid, {
				email: user.email,
				displayName: user.displayName,
				photoURL: user.photoURL,
				isAnonymous: false,
			});
		}

		return user;
	} catch (error) {
		// Special case: User already has a Google account
		// Can't link anonymous account, need to merge data manually
		if (
			error.code === "auth/credential-already-in-use" ||
			error.code === "auth/email-already-in-use"
		) {
			console.log(
				"[Auth] Google account already exists, merging data...",
			);

			try {
				const anonymousUserId = currentUser.uid;

				// Sign out anonymous user (don't wait for new anonymous user)
				await firebaseSignOut(auth);

				// Sign in with existing Google account
				// Use signInWithRedirect to avoid popup blocker after failed linkWithCredential
				const result = await signInWithPopup(auth, googleProvider);
				const googleUser = result.user;

				// Merge anonymous user's data into Google user's account
				const { mergeAnonymousDataToGoogle } =
					await import("./firestore.js");
				await mergeAnonymousDataToGoogle(
					anonymousUserId,
					googleUser.uid,
				);

				console.log(
					"[Auth] Successfully merged and signed in:",
					googleUser.uid,
				);
				return googleUser;
			} catch (mergeError) {
				console.error("[Auth] Error during merge:", mergeError);
				// Re-throw the merge error
				throw mergeError;
			}
		}

		console.error("[Auth] Error signing in with Google:", error);
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
