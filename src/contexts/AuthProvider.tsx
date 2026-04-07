/**
 * AuthProvider - React Context provider for authentication state
 *
 * Wraps the entire app to provide global access to user authentication state.
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 * Then access auth state anywhere using useAuth() hook:
 *   const { user, signIn, signOut, isLoading } = useAuth();
 *
 * Uses Firebase Anonymous Auth to automatically sign in all users (anonymous or Google).
 * ^This eliminates dual storage - everyone uses Firestore with IndexedDB offline persistence.
 *
 * Flow:
 * 1. App loads → auto sign-in anonymously (if not already signed in)
 * 2. User clicks "Sign in with Google" → links anonymous account to Google (data preserved)
 *
 * Auth state machine (status field):
 *
 *   initializing ──▶ ready ◀──────────────────────────────┐
 *                      │                                   │
 *                   signIn()                           signOut()
 *                      │                                   │
 *                  signing-in ──▶ merging ──▶ ready    signing-out ──▶ ready
 *                      │
 *                  aborted/failed ──▶ ready
 *
 * Derived values (computed, not stored):
 *   isLoading = status !== 'ready'
 *   isMerging = status === 'merging'
 */

import { ReactNode, useEffect, useReducer, useRef } from "react";
import type { User } from "firebase/auth";
import {
	onAuthChange,
	signInAnonymously,
	signInWithGoogle as firebaseSignIn,
	signOut as firebaseSignOut,
} from "../services/auth";
import {
	getFirestoreUserData,
	syncFirestoreUserData,
} from "../services/firestore/user";
import { mergeAnonymousDataToGoogle } from "../services/firestore/accountMerge";
import {
	AuthContext,
	type UserObject,
	type UseAuthResult,
} from "./AuthContext";

// ─── State ───────────────────────────────────────────────────────────────────

type AuthStatus =
	| "initializing"
	| "ready"
	| "signing-in"
	| "merging"
	| "signing-out";

interface AuthState {
	user: UserObject | null;
	/** Drives the isLoading/isMerging derived values consumed by components. */
	status: AuthStatus;
	mergeGameState: Record<string, unknown> | null;
	preferInitialGrid: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type AuthAction =
	| { type: "AUTH_READY"; user: UserObject | null }
	| { type: "AUTH_USER_CHANGED"; user: UserObject }
	| { type: "SIGN_IN_START" }
	| { type: "MERGE_START"; gameState: Record<string, unknown> }
	| { type: "SIGN_IN_SUCCESS"; user: UserObject }
	| { type: "SIGN_IN_ABORTED"; priorUser: UserObject | null }
	| { type: "SIGN_OUT_START" }
	| { type: "SIGN_OUT_COMPLETE" }
	| { type: "SIGN_OUT_FAILED" }
	| { type: "CLEAR_MERGE_SNAPSHOT" };

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: AuthState = {
	user: null,
	status: "initializing",
	mergeGameState: null,
	preferInitialGrid: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
	switch (action.type) {
		// Firebase reported a user (idle — no auth op in progress)
		case "AUTH_READY":
			return { ...state, status: "ready", user: action.user };

		// Firebase reported a user while an auth op is in flight.
		// Only updates the user object; status transitions are managed by signIn/signOut.
		case "AUTH_USER_CHANGED":
			return { ...state, user: action.user };

		// User clicked "Sign in with Google"
		case "SIGN_IN_START":
			return {
				...state,
				status: "signing-in",
				mergeGameState: null,
				preferInitialGrid: false,
			};

		// Google sign-in succeeded and anonymous data exists — merge in progress
		case "MERGE_START":
			return {
				...state,
				status: "merging",
				mergeGameState: action.gameState,
			};

		// Sign-in and optional merge completed successfully
		case "SIGN_IN_SUCCESS":
			return { ...state, status: "ready", user: action.user };

		// Popup closed by user or sign-in failed — restore prior state cleanly
		case "SIGN_IN_ABORTED":
			return {
				...state,
				status: "ready",
				mergeGameState: null,
				user: action.priorUser,
			};

		// User clicked "Sign out" — user cleared eagerly so listeners unsubscribe
		case "SIGN_OUT_START":
			return {
				...state,
				status: "signing-out",
				user: null,
				preferInitialGrid: true,
			};

		// Sign-out complete; new anonymous user will arrive via AUTH_USER_CHANGED / AUTH_READY
		case "SIGN_OUT_COMPLETE":
			return { ...state, status: "ready" };

		// Sign-out failed; roll back flag (onAuthChange will restore the correct user)
		case "SIGN_OUT_FAILED":
			return {
				...state,
				status: "ready",
				preferInitialGrid: false,
			};

		// Called by useGameState once Firestore confirms the merged state
		case "CLEAR_MERGE_SNAPSHOT":
			return { ...state, mergeGameState: null };
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toUserObject(firebaseUser: User): UserObject {
	return {
		uid: firebaseUser.uid,
		email: firebaseUser.email,
		displayName: firebaseUser.displayName,
		photoURL: firebaseUser.photoURL,
		isAnonymous: firebaseUser.isAnonymous,
	};
}

async function syncUserDoc(firebaseUser: User): Promise<void> {
	try {
		await syncFirestoreUserData(firebaseUser);
	} catch (error) {
		console.error("[AuthProvider] Error syncing user doc:", error);
	}
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuthProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(authReducer, initialState);
	// Ref (not state) because it must be readable synchronously in onAuthChange
	// without triggering re-renders or stale-closure issues.
	const authInProgressRef = useRef(false);

	useEffect(() => {
		const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
			if (firebaseUser) {
				const user = toUserObject(firebaseUser);
				// If an auth op is in flight, only update the user object.
				// Status transitions are owned by signIn() / signOut().
				dispatch(
					authInProgressRef.current
						? { type: "AUTH_USER_CHANGED", user }
						: { type: "AUTH_READY", user },
				);
				syncUserDoc(firebaseUser);
			} else {
				// No user — auto sign in anonymously.
				// onAuthChange will fire again with the new anonymous user.
				try {
					await signInAnonymously();
				} catch (error) {
					console.error(
						"[Auth] Failed to sign in anonymously:",
						error,
					);
					if (!authInProgressRef.current) {
						dispatch({ type: "AUTH_READY", user: null });
					}
				}
			}
		});

		return () => unsubscribe();
	}, []);

	const signIn = async (): Promise<User | null> => {
		// Capture the current user before any state changes so we can restore on failure.
		const priorUser = state.user;

		authInProgressRef.current = true;
		dispatch({ type: "SIGN_IN_START" });

		try {
			// Pre-fetch anonymous data BEFORE auth state changes.
			// signInWithPopup will change who is signed in, so we capture this now.
			const anonymousUid = priorUser?.isAnonymous ? priorUser.uid : null;
			const anonymousData = anonymousUid
				? await getFirestoreUserData(anonymousUid)
				: null;

			if (anonymousData?.gameState) {
				// Signal that a merge is about to happen so UI preserves the current board.
				dispatch({
					type: "MERGE_START",
					gameState: anonymousData.gameState,
				});
			}

			const firebaseUser = await firebaseSignIn();

			// Ensure the destination user doc exists before any merge writes.
			// Without this, merge may race with auth-sync and fail with precondition errors.
			await syncUserDoc(firebaseUser);

			// If the UID changed, linkWithCredential failed (account already existed).
			// Merge the anonymous user's data into the Google account.
			if (anonymousUid && firebaseUser.uid !== anonymousUid) {
				await mergeAnonymousDataToGoogle(
					anonymousUid,
					anonymousData?.gameState,
					firebaseUser.uid,
				);
			}

			dispatch({
				type: "SIGN_IN_SUCCESS",
				user: toUserObject(firebaseUser),
			});
			return firebaseUser;
		} catch (error) {
			const authError = error as { code?: string };
			const isCancelled =
				authError.code === "auth/popup-closed-by-user" ||
				authError.code === "auth/cancelled-popup-request";

			// Restore state cleanly. mergeGameState is also cleared so the
			// board doesn't flash with the pending merge state.
			dispatch({ type: "SIGN_IN_ABORTED", priorUser });

			if (!isCancelled) {
				console.error("[Auth] Sign in error:", error);
				throw error;
			}
			// Cancelled — user deliberately closed the popup. Don't throw; let
			// GoogleSignInButton's finally re-enable the button without an error message.
			return null;
		} finally {
			authInProgressRef.current = false;
		}
	};

	const signOut = async (): Promise<void> => {
		authInProgressRef.current = true;
		// Clear user eagerly so user-scoped listeners unsubscribe before auth tokens rotate.
		dispatch({ type: "SIGN_OUT_START" });
		try {
			await firebaseSignOut();
			// onAuthChange will fire with null → signInAnonymously() → new anon user
		} catch (error) {
			console.error("[Auth] Sign out error:", error);
			dispatch({ type: "SIGN_OUT_FAILED" });
			throw error;
		} finally {
			authInProgressRef.current = false;
			dispatch({ type: "SIGN_OUT_COMPLETE" });
		}
	};

	const onMergeSettled = () => dispatch({ type: "CLEAR_MERGE_SNAPSHOT" });

	const value: UseAuthResult = {
		user: state.user,
		isLoading: state.status !== "ready",
		isMerging: state.status === "merging",
		preferInitialGrid: state.preferInitialGrid,
		mergeGameState: state.mergeGameState,
		onMergeSettled,
		signIn,
		signOut,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
