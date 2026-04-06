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
	signInAnonymously as firebaseSignInAnonymously,
	signInWithPopup,
	signInWithCredential,
	linkWithPopup,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

const googleProvider = new GoogleAuthProvider();

/**
 * Wraps a Firebase popup call and rejects within ~200ms of the popup closing,
 * rather than waiting for Firebase's internal polling timeout (~8–10s).
 *
 * Strategy:
 *   1. Temporarily patch window.open to capture the popup window reference.
 *   2. Race Firebase's promise against our own popup.closed polling loop.
 *   3. A 500ms grace period after closure detection lets Firebase resolve first
 *      if auth just completed (popup closes right after a successful sign-in).
 */
async function withPopupCloseDetection(firebasePopupFn) {
	let capturedPopup = null;
	let pollInterval = null;

	const originalOpen = window.open.bind(window);
	window.open = (...args) => {
		window.open = originalOpen; // restore immediately after first call
		capturedPopup = originalOpen(...args);
		return capturedPopup;
	};

	const firebasePromise = firebasePopupFn();
	// Suppress the background Firebase rejection if our close-detector wins the
	// race, so it doesn't surface as an unhandled-rejection console error.
	firebasePromise.catch(() => {});

	const closedEarlyPromise = new Promise((_, reject) => {
		pollInterval = setInterval(() => {
			if (capturedPopup?.closed) {
				clearInterval(pollInterval);
				pollInterval = null;
				// Grace period: if auth just completed, Firebase's promise will
				// resolve within ~500ms of the popup closing. If it does, Promise.race
				// resolves with Firebase's result and our rejection is ignored.
				setTimeout(() => {
					const err = new Error("Popup closed by user");
					err.code = "auth/popup-closed-by-user";
					reject(err);
				}, 500);
			}
		}, 200);
	});

	try {
		return await Promise.race([firebasePromise, closedEarlyPromise]);
	} finally {
		window.open = originalOpen;
		if (pollInterval) clearInterval(pollInterval);
	}
}

/**
 * Sign in anonymously (called automatically on app load)
 * Creates a temporary Firebase user ID so anonymous users can save to Firestore
 * @returns {Promise<User>} Anonymous Firebase user
 */
export async function signInAnonymously() {
	const result = await firebaseSignInAnonymously(auth);
	return result.user;
}

/**
 * Sign in with Google (upgrades anonymous account if applicable)
 *
 * If the user is currently anonymous, links their account to Google so all data is preserved.
 * If the Google account already exists (credential-already-in-use), signs in with it instead
 * and the caller is responsible for merging the anonymous data.
 *
 * @returns {Promise<User>} Firebase user object
 * @throws {Error} If sign-in fails or is cancelled
 */
export async function signInWithGoogle() {
	const currentUser = auth.currentUser;

	try {
		if (currentUser?.isAnonymous) {
			return await linkAnonymousWithGoogle(currentUser);
		}

		const result = await withPopupCloseDetection(() =>
			signInWithPopup(auth, googleProvider),
		);
		return result.user;
	} catch (error) {
		if (error.code === "auth/popup-blocked") {
			const friendly = new Error(
				"Sign-in popup was blocked. Please allow popups for this site and try again.",
			);
			friendly.code = "auth/popup-blocked";
			throw friendly;
		}
		console.error("[Auth] Error signing in with Google:", error);
		throw error;
	}
}

/**
 * Attempt to link an anonymous account with Google.
 * Falls back to signing in with existing credentials if the account already exists.
 */
async function linkAnonymousWithGoogle(anonymousUser) {
	try {
		const result = await withPopupCloseDetection(() =>
			linkWithPopup(anonymousUser, googleProvider),
		);
		return result.user;
	} catch (error) {
		if (error.code === "auth/popup-blocked") {
			const friendly = new Error(
				"Sign-in popup was blocked. Please allow popups for this site and try again.",
			);
			friendly.code = "auth/popup-blocked";
			throw friendly;
		}
		if (
			error.code === "auth/credential-already-in-use" ||
			error.code === "auth/email-already-in-use"
		) {
			// Google account already exists — sign in with it instead.
			// The caller will detect the UID change and handle the merge.
			const credential = GoogleAuthProvider.credentialFromError(error);
			if (credential) {
				const result = await signInWithCredential(auth, credential);
				return result.user;
			}
			// credentialFromError returned null (shouldn't happen) — fall back to popup.
			const result = await signInWithPopup(auth, googleProvider);
			return result.user;
		}
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
	await firebaseSignOut(auth);
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
