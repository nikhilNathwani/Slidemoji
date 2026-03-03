import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

/**
 * Hook to access authentication state and functions
 * Usage: const { user, signIn, signOut, loading } = useAuth();
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
