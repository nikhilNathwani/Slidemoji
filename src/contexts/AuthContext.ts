import { createContext } from "react";
import type { User } from "firebase/auth";

// ─── Shared types ────────────────────────────────────────────────────────────

/** Serialisable subset of a Firebase User stored in reducer state. */
export interface UserObject {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAnonymous: boolean;
}

/** Shape of the value provided by AuthProvider and consumed by useAuth(). */
export interface UseAuthResult {
	user: UserObject | null;
	isLoading: boolean;
	isMerging: boolean;
	preferInitialGrid: boolean;
	/** Called by useGameState when Firestore data has settled after a merge. */
	onMergeSettled: () => void;
	signIn: () => Promise<User | null>;
	signOut: () => Promise<void>;
	anonymousSnapshot: Record<string, unknown> | null;
}

export const AuthContext = createContext<UseAuthResult | null>(null);
