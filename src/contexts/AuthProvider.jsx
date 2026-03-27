/**
 * AuthProvider - React Context provider for authentication state
 *
 * Wraps the entire app to provide global access to user authentication state.
 * Listens to Firebase auth changes and automatically updates when user signs in/out.
 * Also handles localStorage to Firestore migration when users sign in.
 *
 * Usage: Wrap your app in main.jsx:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 * Then access auth state anywhere using useAuth() hook:
 *   const { user, signIn, signOut, loading } = useAuth();
 */

import { useState, useEffect } from "react";
import {
	onAuthChange,
	signInWithGoogle as firebaseSignIn,
	signOut as firebaseSignOut,
} from "../backend";
import { AuthContext } from "./authContext";
import { migrateLocalStorageToFirestore } from "../storage";
import { getLatestPuzzleId } from "../utils/puzzleUtils";
/**
 * AuthProvider component - manages authentication state for the entire app
 *
 * State:
 * - user: Current user object { uid, email, displayName, photoURL } or null
 * - loading: True while checking initial auth state or during sign-in/out
 *
 * Functions:
 * - signIn(): Opens Google sign-in popup
 * - signOut(): Signs out current user
 * - isAuthenticated: Computed boolean (!!user)
 */
export default function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true); // Start true while checking auth

	useEffect(() => {
		// Listen for auth state changes from Firebase
		// This fires immediately with current state, then on any auth changes
		// Also detects sign-in/out in other tabs (Firebase handles this automatically!)
		const unsubscribe = onAuthChange((firebaseUser) => {
			if (firebaseUser) {
				// User is signed in - extract relevant data
				setUser({
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL, // Google profile picture
				});
			} else {
				// User is signed out
				setUser(null);
			}
			setLoading(false); // Auth state is now known
		});

		// Cleanup: unsubscribe from auth listener when component unmounts
		return () => unsubscribe();
	}, []);

	const signIn = async () => {
		try {
			setLoading(true);
			const firebaseUser = await firebaseSignIn();

			// Migrate localStorage data to Firestore after successful sign-in
			// Only migrate current puzzle (today's puzzle) to avoid retroactive trophies
			if (firebaseUser?.uid) {
				try {
					const currentPuzzleId = getLatestPuzzleId();
					await migrateLocalStorageToFirestore(
						firebaseUser.uid,
						currentPuzzleId,
					);
				} catch (migrationError) {
					console.error(
						"[Migration] Failed to migrate localStorage:",
						migrationError,
					);
					// Don't throw - sign-in was successful even if migration failed
				}
			}

			// User state will be set by onAuthChange listener above
			// No need to call setUser here - listener will handle it
			return firebaseUser;
		} catch (error) {
			console.error("Sign in error:", error);
			setLoading(false);
			throw error;
		}
	};

	const signOut = async () => {
		try {
			setLoading(true);
			await firebaseSignOut();
			// User state will be cleared by onAuthChange listener
		} catch (error) {
			console.error("Sign out error:", error);
			setLoading(false);
			throw error;
		}
	};

	// Context value exposed to all children via useAuth() hook
	const value = {
		user, // Current user object or null
		loading, // True during auth operations
		signIn, // Function to sign in with Google
		signOut, // Function to sign out
		isAuthenticated: !!user, // Convenience boolean
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
