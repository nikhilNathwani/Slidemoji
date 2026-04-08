import { createContext } from "react";
import type {
	UserDoc,
	GameState,
} from "../services/firestore/userDoc";
export type { UserDoc, GameState };

/** Shape of the value provided by UserDocProvider and consumed by useUserDoc(). */
export interface UseUserDocResult {
	userDoc: UserDoc | null;
	isLoading: boolean;
	error: Error | null;
}

export const UserDocContext = createContext<UseUserDocResult | null>(null);
