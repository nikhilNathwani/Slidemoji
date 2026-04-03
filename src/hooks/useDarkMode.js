import { useEffect } from "react";
import { usePreference } from "./usePreference";

/**
 * useDarkMode - Applies dark/light theme class to the document root.
 *
 * Calling this hook once (in App) handles the DOM side effect.
 * Any component that needs to READ or SET the value (e.g. SettingsDialog)
 * can also call this hook directly — usePreference shares the same
 * Firestore subscription so the value is always consistent.
 *
 * The class is applied to document.documentElement (html) so CSS variables
 * cascade to every element without requiring a wrapper div.
 */
export function useDarkMode() {
	const [darkMode, setDarkMode] = usePreference("darkMode");

	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dark-theme", darkMode);
		root.classList.toggle("light-theme", !darkMode);
	}, [darkMode]);

	return [darkMode, setDarkMode];
}
