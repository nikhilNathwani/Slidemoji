import { createContext } from "react";
import type { UserDoc, PuzzleProgress } from "../services/firestore/user";
export type { UserDoc, PuzzleProgress };

/** Shape of the value provided by UserDocProvider and consumed by useUserDoc(). */
export interface UseUserDocResult {
	userDoc: UserDoc | null;
	isLoading: boolean;
	error: Error | null;
}

export const UserDocContext = createContext<UseUserDocResult | null>(null);
