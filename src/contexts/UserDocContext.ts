import { createContext } from "react";

/** Raw Firestore user document data. Typed loosely to accommodate evolving schema. */
export interface UserData {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAnonymous: boolean;
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
	userData: UserData | null;
	loading: boolean;
	error: Error | null;
}

export const UserDocContext = createContext<UseUserDocResult | null>(null);
