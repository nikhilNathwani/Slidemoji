/**
 * AuthProvider - React Context provider for authentication state
 *
 * Wraps the entire app to provide global access to user authentication state.
 *  <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 * Then access auth state anywhere using useAuth() hook:
 *   const { user, signIn, signOut, loading, isAnonymous } = useAuth();
 *
 * Uses Firebase Anonymous Auth to automatically sign in all users (anonymous or Google).
 * ^This eliminates dual storage - everyone uses Firestore with IndexedDB offline persistence.
 *
 * Flow:
 * 1. App loads → auto sign-in anonymously (if not already signed in)
 * 2. User clicks "Sign in with Google" → links anonymous account to Google (data preserved)
 */

import { useEffect, useRef, useState } from "react";
import {
	onAuthChange,
	signInAnonymouslyIfNeeded,
	signInWithGoogle as firebaseSignIn,
	signOut as firebaseSignOut,
} from "../firebase/auth";
import {
	getFirestoreUserData,
	syncFirestoreUserData,
} from "../firebase/firestore/user";
import { mergeAnonymousDataToGoogle } from "../utils/accountMerge";
import { AuthContext } from "./AuthContext";

// Sync the Firestore user document after an auth state change.
// Creates the doc if it doesn't exist; updates profile fields for Google users.
async function syncUserDoc(firebaseUser) {
	try {
		await syncFirestoreUserData(firebaseUser);
		return true;
	} catch (error) {
		console.error("[AuthProvider] Error syncing user doc:", error);
		return false;
	}
}
/**
 * AuthProvider component - manages authentication state for the entire app
 *
 * State:
 * - user: Current user object { uid, email, displayName, photoURL, isAnonymous } or null
 * - loading: True while checking initial auth state or during sign-in/out
 *
 * Functions:
 * - signIn(): Opens Google sign-in popup (links to anonymous account if applicable)
 * - signOut(): Signs out current user (creates new anonymous user automatically)
 * - isAuthenticated: Boolean (true if signed in with Google, false if anonymous)
 * - isAnonymous: Boolean (true if anonymous, false if Google)
 */
export default function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true); // Start true while checking auth
	const [isMerging, setIsMerging] = useState(false);
	const [mergeSnapshotGameState, setMergeSnapshotGameState] = useState(null);
	const [preferInitialAnonymousState, setPreferInitialAnonymousState] =
		useState(false);
	const authOpInFlightRef = useRef(false);

	useEffect(() => {
		const unsubscribe = onAuthChange(async (firebaseUser) => {
			if (firebaseUser) {
				// Update UI immediately, then sync Firestore doc in background
				setUser({
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL,
					isAnonymous: firebaseUser.isAnonymous,
				});
				if (!authOpInFlightRef.current) {
					setLoading(false);
				}
				syncUserDoc(firebaseUser);
			} else {
				// No user — auto sign in anonymously
				try {
					await signInAnonymouslyIfNeeded();
					// onAuthChange will fire again with the new anonymous user
				} catch (error) {
					console.error(
						"[Auth] Failed to sign in anonymously:",
						error,
					);
					setUser(null);
					if (!authOpInFlightRef.current) {
						setLoading(false);
					}
				}
			}
		});

		return () => unsubscribe();
	}, []);

	const signIn = async () => {
		try {
			authOpInFlightRef.current = true;
			setLoading(true);
			setIsMerging(false);
			setPreferInitialAnonymousState(false);

			// Pre-fetch anonymous data BEFORE auth state changes.
			// signInWithPopup will change who is signed in, so we capture this now.
			const anonymousUid = user?.isAnonymous ? user.uid : null;
			const anonymousData = anonymousUid
				? await getFirestoreUserData(anonymousUid)
				: null;

			if (anonymousData?.gameState) {
				// Mark merge transition before auth user switch so UI can preserve current board.
				setIsMerging(true);
				setMergeSnapshotGameState(anonymousData.gameState);
			}

			const firebaseUser = await firebaseSignIn();

			// Ensure the destination user doc exists before any merge writes.
			// Without this, merge may race with auth-sync and fail with precondition errors.
			await syncUserDoc(firebaseUser);

			// If the UID changed, linkWithCredential failed (account already existed).
			// Merge the anonymous user's data into the Google account.
			if (anonymousData && anonymousUid && firebaseUser.uid !== anonymousUid) {
				await mergeAnonymousDataToGoogle(
					anonymousUid,
					firebaseUser.uid,
					anonymousData,
				);
			}

			return firebaseUser;
		} catch (error) {
			console.error("[Auth] Sign in error:", error);
			throw error;
		} finally {
			authOpInFlightRef.current = false;
			setIsMerging(false);
			setMergeSnapshotGameState(null);
			setLoading(false);
		}
	};

	const signOut = async () => {
		try {
			authOpInFlightRef.current = true;
			setLoading(true);
			setPreferInitialAnonymousState(true);
			// Clear user eagerly so user-scoped listeners unsubscribe before auth tokens rotate.
			setUser(null);
			await firebaseSignOut();
			// After sign-out, onAuthChange will detect no user and auto-create new anonymous user
		} catch (error) {
			console.error("[Auth] Sign out error:", error);
			setPreferInitialAnonymousState(false);
			setLoading(false);
			throw error;
		} finally {
			authOpInFlightRef.current = false;
		}
	};

	// Context value exposed to all children via useAuth() hook
	const value = {
		user, // Current user object (always exists - either anonymous or Google)
		loading, // True during auth operations
		isMerging, // True while anonymous->Google merge is reconciling
		preferInitialAnonymousState, // True after sign-out so anonymous view can render initial grid immediately
		mergeSnapshotGameState, // Anonymous gameState snapshot while merge is in progress
		signIn, // Function to sign in with Google (links anonymous account)
		signOut, // Function to sign out (creates new anonymous user)
		isAuthenticated: user?.isAnonymous === false, // True if signed in with Google
		isAnonymous: user?.isAnonymous ?? true, // True if anonymous user
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
