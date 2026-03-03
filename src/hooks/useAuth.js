/**
 * useAuth Hook - Access authentication state from anywhere in the app
 *
 * Must be used inside a component wrapped by <AuthProvider>.
 *
 * Returns:
 * - user: { uid, email, displayName, photoURL } or null
 * - loading: boolean (true during auth operations)
 * - signIn: async function to sign in with Google
 * - signOut: async function to sign out
 * - isAuthenticated: boolean convenience property
 *
 * Example:
 *   const { user, signIn, signOut } = useAuth();
 *   if (user) {
 *     return <button onClick={signOut}>Sign Out</button>;
 *   }
 */

import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

/**
 * Hook to access authentication state and functions
 *
 * @throws {Error} If used outside of AuthProvider
 * @returns {Object} { user, signIn, signOut, loading, isAuthenticated }
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
