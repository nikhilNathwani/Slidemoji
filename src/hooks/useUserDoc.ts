import { useContext } from "react";
import {
	UserDocContext,
	type UseUserDocResult,
} from "../contexts/UserDocContext";

export function useUserDoc(): UseUserDocResult {
	const context = useContext(UserDocContext);
	if (!context) {
		throw new Error("useUserDoc must be used within UserDocProvider");
	}
	return context;
}
