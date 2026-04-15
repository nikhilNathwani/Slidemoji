import { useContext } from "react";
import { AuthContext, type UseAuthResult } from "./AuthContext";

export function useAuth(): UseAuthResult {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
