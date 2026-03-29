import { createContext, useContext } from "react";

export const UserDocContext = createContext(null);

export function useUserDoc() {
	const context = useContext(UserDocContext);
	if (!context) {
		throw new Error("useUserDoc must be used within UserDocProvider");
	}
	return context;
}
