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
 *
 *
 */

import { useEffect, useRef, useState } from "react";
import {
	onAuthChange,
	signInAnonymouslyIfNeeded,
	signInWithGoogle as firebaseSignIn,
	signOut as firebaseSignOut,
	shouldUseRedirectFlow,
} from "../firebase";
import {
	getFirestoreUserData,
	syncFirestoreUserData,
} from "../firebase/firestore/user";
import { mergeAnonymousDataToGoogle } from "../utils/accountMerge";
import { AuthContext } from "./AuthContext";

const PENDING_MERGE_KEY = "pendingAnonymousMerge";

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
		// Listen for auth state changes from Firebase
		// This fires immediately with current state, then on any auth changes
		const unsubscribe = onAuthChange(async (firebaseUser) => {
			const logObj = {
				timestamp: new Date().toISOString(),
				firebaseUser,
				uid: firebaseUser?.uid,
				email: firebaseUser?.email,
				displayName: firebaseUser?.displayName,
				photoURL: firebaseUser?.photoURL,
				isAnonymous: firebaseUser?.isAnonymous,
				providerData: firebaseUser?.providerData,
				currentUrl: window.location.href,
				pendingMerge: sessionStorage.getItem(PENDING_MERGE_KEY),
			};
			console.log("[AuthProvider] onAuthChange fired", logObj);
			try {
				// LocalStorage
				const logs = JSON.parse(
					localStorage.getItem("slidemoji_auth_logs") || "[]",
				);
				logs.push(logObj);
				localStorage.setItem(
					"slidemoji_auth_logs",
					JSON.stringify(logs),
				);
			} catch (e) {
				console.error(
					"[AuthProvider] Failed to write auth log to localStorage",
					e,
				);
			}
			try {
				// SessionStorage fallback
				const sLogs = JSON.parse(
					sessionStorage.getItem("slidemoji_auth_logs") || "[]",
				);
				sLogs.push(logObj);
				sessionStorage.setItem(
					"slidemoji_auth_logs",
					JSON.stringify(sLogs),
				);
			} catch (e) {
				console.error(
					"[AuthProvider] Failed to write auth log to sessionStorage",
					e,
				);
			}
			try {
				// Window fallback (for debugging)
				if (typeof window !== "undefined") {
					window.slidemoji_auth_logs =
						window.slidemoji_auth_logs || [];
					window.slidemoji_auth_logs.push(logObj);
				}
			} catch (e) {
				console.error(
					"[AuthProvider] Failed to write auth log to window",
					e,
				);
			}
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

				// Complete pending merge after redirect-based auth flows.
				const pendingRaw = sessionStorage.getItem(PENDING_MERGE_KEY);
				if (pendingRaw) {
					try {
						const pending = JSON.parse(pendingRaw);
						console.log(
							"[AuthProvider] Found pending merge after redirect",
							{ pending },
						);
						if (
							pending?.anonymousUid &&
							pending?.anonymousData &&
							pending.anonymousUid !== firebaseUser.uid
						) {
							await mergeAnonymousDataToGoogle(
								pending.anonymousUid,
								firebaseUser.uid,
								pending.anonymousData,
							);
							console.log(
								"[AuthProvider] Merge after redirect complete",
							);
						}
					} catch (error) {
						console.error(
							"[AuthProvider] Error completing pending redirect merge:",
							error,
						);
					} finally {
						sessionStorage.removeItem(PENDING_MERGE_KEY);
					}
				}
			} else {
				// No user - auto sign in anonymously
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

		// Cleanup: unsubscribe from auth listener when component unmounts
		return () => unsubscribe();
	}, []); // Empty dependency array - only run once on mount

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
			const hasAnonymousGameState = !!anonymousData?.gameState;
			if (hasAnonymousGameState) {
				// Mark merge transition before auth user switch so UI can preserve current board.
				setIsMerging(true);
				setMergeSnapshotGameState(anonymousData.gameState);
			}
			console.log("[AuthProvider] signIn prefetch", {
				anonymousUid,
				hasAnonymousData: !!anonymousData,
				hasAnonymousGameState: !!anonymousData?.gameState,
			});

			const useRedirect = shouldUseRedirectFlow();
			if (useRedirect && anonymousUid && anonymousData) {
				sessionStorage.setItem(
					PENDING_MERGE_KEY,
					JSON.stringify({ anonymousUid, anonymousData }),
				);
			}

			const firebaseUser = await firebaseSignIn({
				forceRedirect: useRedirect,
			});
			if (!firebaseUser) {
				// Redirect flow started; browser will navigate away.
				return null;
			}

			// Ensure the destination user doc exists before any merge writes.
			// Without this, merge may race with auth-sync and fail with precondition errors.
			await syncUserDoc(firebaseUser);

			// If the UID changed, linkWithCredential failed (account already existed).
			// Merge the anonymous user's data into the Google account.
			if (
				anonymousData &&
				anonymousUid &&
				firebaseUser.uid !== anonymousUid
			) {
				console.log(
					"[AuthProvider] Merging anonymous data into Google account...",
				);
				await mergeAnonymousDataToGoogle(
					anonymousUid,
					firebaseUser.uid,
					anonymousData,
				);
				console.log("[AuthProvider] Merge complete", {
					anonymousUid,
					googleUid: firebaseUser.uid,
				});
			} else {
				console.log("[AuthProvider] Merge skipped", {
					hasAnonymousData: !!anonymousData,
					anonymousUid,
					googleUid: firebaseUser?.uid,
					sameUid: firebaseUser?.uid === anonymousUid,
				});
			}

			return firebaseUser;
		} catch (error) {
			console.error("[Auth] Sign in error:", error);
			setIsMerging(false);
			setMergeSnapshotGameState(null);
			setLoading(false);
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
			// User state will be updated by onAuthChange listener
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
