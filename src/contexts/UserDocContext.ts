import { createContext } from "react";

/** Firestore app-data document for a user. Auth identity fields (uid, email, etc.) live in UserObject via useAuth(). */
export interface UserDoc {
	isPremium: boolean;
	gameState: Record<string, unknown> | null;
	preferences: {
		darkMode: boolean;
		soundEnabled: boolean;
	};
	createdAt?: unknown; // Firestore server timestamp — written by app, never read
	updatedAt?: unknown;
}

/** Shape of the value provided by UserDocProvider and consumed by useUserDoc(). */
export interface UseUserDocResult {
	userData: UserDoc | null;
	isLoading: boolean;
	error: Error | null;
}

export const UserDocContext = createContext<UseUserDocResult | null>(null);
