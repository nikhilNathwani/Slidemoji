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
	signInWithRedirect,
	signInWithCredential,
	linkWithPopup,
	linkWithRedirect,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// Google OAuth provider for Firebase Authentication
const googleProvider = new GoogleAuthProvider();

export function shouldUseRedirectFlow() {
	if (typeof navigator === "undefined") {
		return false;
	}
	const ua = navigator.userAgent || "";
	return /Android|iPhone|iPad|iPod/i.test(ua);
}

/**
 * Sign in anonymously (called automatically on app load)
 * Creates a temporary Firebase user ID so anonymous users can save to Firestore
 * @returns {Promise<User>} Anonymous Firebase user
 */
export async function signInAnonymouslyIfNeeded() {
	if (auth.currentUser) {
		return auth.currentUser;
	}

	try {
		const result = await signInAnonymously(auth);
		console.log("[Auth] Signed in anonymously:", result.user.uid);
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
export async function signInWithGoogle({ forceRedirect = false } = {}) {
	const currentUser = auth.currentUser;
	const useRedirect = forceRedirect;

	try {
		if (currentUser?.isAnonymous) {
			console.log("[Auth] Upgrading anonymous account to Google");
			try {
				const linkedUser = await linkWithPopup(
					currentUser,
					googleProvider,
				);
				console.log(
					"[Auth] Successfully upgraded to Google:",
					linkedUser.user.uid,
				);
				return linkedUser.user;
			} catch (error) {
				if (
					error.code === "auth/popup-blocked" ||
					error.code === "auth/popup-closed-by-user"
				) {
					await linkWithRedirect(currentUser, googleProvider);
					return null;
				}
				if (
					error.code === "auth/credential-already-in-use" ||
					error.code === "auth/email-already-in-use"
				) {
					// Use credential from error when available to avoid reopening popup repeatedly.
					const existingCredential =
						GoogleAuthProvider.credentialFromError(error);
					let googleUser = null;

					if (existingCredential) {
						const result = await signInWithCredential(
							auth,
							existingCredential,
						);
						googleUser = result.user;
					} else {
						const result = await signInWithPopup(
							auth,
							googleProvider,
						);
						googleUser = result.user;
					}

					console.log(
						"[Auth] Google account already existed:",
						googleUser.uid,
					);
					return googleUser;
				}
				console.error(
					"[Auth] Error signing in with Google (anonymous upgrade):",
					error,
				);
				throw error;
			}
		}

		// Regular Google sign-in (user is not anonymous)
		try {
			const result = await signInWithPopup(auth, googleProvider);
			console.log("[Auth] Signed in with Google:", result.user.uid);
			return result.user;
		} catch (error) {
			if (
				error.code === "auth/popup-blocked" ||
				error.code === "auth/popup-closed-by-user"
			) {
				await signInWithRedirect(auth, googleProvider);
				return null;
			}
			if (
				error.code === "auth/credential-already-in-use" ||
				error.code === "auth/email-already-in-use"
			) {
				const existingCredential =
					GoogleAuthProvider.credentialFromError(error);
				let googleUser = null;

				if (existingCredential) {
					const result = await signInWithCredential(
						auth,
						existingCredential,
					);
					googleUser = result.user;
				} else {
					const result = await signInWithPopup(auth, googleProvider);
					googleUser = result.user;
				}

				console.log(
					"[Auth] Google account already existed:",
					googleUser.uid,
				);
				return googleUser;
			}
			console.error("[Auth] Error signing in with Google:", error);
			throw error;
		}
	} catch (error) {
		console.error("[Auth] Error signing in with Google (outer):", error);
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
