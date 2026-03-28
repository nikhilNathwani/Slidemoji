/**
 * AuthProvider - React Context provider for authentication state
 *
 * Wraps the entire app to provide global access to user authentication state.
 * Uses Firebase Anonymous Auth to automatically sign in all users (anonymous or Google).
 * This eliminates dual storage - everyone uses Firestore with IndexedDB offline persistence.
 *
 * Flow:
 * 1. App loads → auto sign-in anonymously (if not already signed in)
 * 2. User clicks "Sign in with Google" → links anonymous account to Google (data preserved!)
 * 3. All data always in Firestore, no localStorage needed
 *
 * Usage: Wrap your app in main.jsx:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 * Then access auth state anywhere using useAuth() hook:
 *   const { user, signIn, signOut, loading, isAnonymous } = useAuth();
 */

import { useState, useEffect } from "react";
import {
	onAuthChange,
	signInAnonymouslyIfNeeded,
	signInWithGoogle as firebaseSignIn,
	signOut as firebaseSignOut,
} from "../backend";
import { AuthContext } from "./authContext";
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

	useEffect(() => {
		// Listen for auth state changes from Firebase
		// This fires immediately with current state, then on any auth changes
		const unsubscribe = onAuthChange(async (firebaseUser) => {
			if (firebaseUser) {
				// User is signed in (anonymous or Google)
				setUser({
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL,
					isAnonymous: firebaseUser.isAnonymous,
				});
				setLoading(false);
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
					setLoading(false);
				}
			}
		});

		// Cleanup: unsubscribe from auth listener when component unmounts
		return () => unsubscribe();
	}, []);

	const signIn = async () => {
		try {
			setLoading(true);
			// Sign in with Google (automatically links anonymous account if applicable)
			const firebaseUser = await firebaseSignIn();
			// User state will be set by onAuthChange listener above
			return firebaseUser;
		} catch (error) {
			console.error("[Auth] Sign in error:", error);
			setLoading(false);
			throw error;
		}
	};

	const signOut = async () => {
		try {
			setLoading(true);
			await firebaseSignOut();
			// After sign-out, onAuthChange will detect no user and auto-create new anonymous user
			// User state will be updated by onAuthChange listener
		} catch (error) {
			console.error("[Auth] Sign out error:", error);
			setLoading(false);
			throw error;
		}
	};

	// Context value exposed to all children via useAuth() hook
	const value = {
		user, // Current user object (always exists - either anonymous or Google)
		loading, // True during auth operations
		signIn, // Function to sign in with Google (links anonymous account)
		signOut, // Function to sign out (creates new anonymous user)
		isAuthenticated: user && !user.isAnonymous, // True if signed in with Google
		isAnonymous: user?.isAnonymous ?? true, // True if anonymous user
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
