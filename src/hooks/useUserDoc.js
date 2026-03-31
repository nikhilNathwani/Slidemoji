import { useContext } from "react";
import { UserDocContext } from "../contexts/UserDocContext";

export function useUserDoc() {
	const context = useContext(UserDocContext);
	if (!context) {
		throw new Error("useUserDoc must be used within UserDocProvider");
	}
	return context;
}
