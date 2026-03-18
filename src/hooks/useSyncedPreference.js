/**
 * useSyncedPreference - Manage preferences that sync between localStorage and Firestore
 *
 * This hook abstracts the pattern of storing preferences in localStorage for signed-out users
 * and syncing them to Firestore for signed-in users (for cross-device sync).
 *
 * @param {string} key - The preference key (e.g., 'darkMode', 'soundEnabled', 'gridSize')
 * @param {*} defaultValue - The default value if no saved preference exists
 * @param {Object} options - Optional configuration
 * @param {boolean} options.persistForSignedOut - Whether signed-out users should see their localStorage value (default: true)
 * @param {string} options.contextKey - Optional key to scope this preference (e.g., puzzleId for daily reset)
 * @returns {[any, Function]} - [currentValue, setValue] tuple (like useState)
 *
 * Usage:
 *   // Normal preference (persists for everyone)
 *   const [darkMode, setDarkMode] = useSyncedPreference('darkMode', false);
 *
 *   // Ephemeral for signed-out users (always shows default, but localStorage used as Firestore fallback for signed-in)
 *   const [gridSize, setGridSize] = useSyncedPreference('gridSize', 3, { persistForSignedOut: false });
 *
 *   // Context-scoped (e.g., resets to default for each new puzzle)
 *   const [showNumbers, setShowNumbers] = useSyncedPreference('showNumbers', true, { contextKey: puzzleId });
 */

import { useState } from "react";
import { useAuth } from "./useAuth";
import { useUser } from "./useUser";
import { useUpdatePreferences } from "./useUpdatePreferences";

export function useSyncedPreference(
	key,
	defaultValue,
	options = { persistForSignedOut: true, contextKey: null },
) {
	const { user } = useAuth();
	const { data: userData } = useUser(user?.uid);
	const { mutate: updatePreferences } = useUpdatePreferences(user?.uid);

	// If contextKey is provided, scope the storage key (e.g., showNumbers_123 for puzzle 123)
	const storageKey = options.contextKey
		? `${key}_${options.contextKey}`
		: key;

	// Initialize from localStorage
	const [localValue, setLocalValue] = useState(() => {
		const saved = localStorage.getItem(storageKey);
		return saved !== null ? JSON.parse(saved) : defaultValue;
	});

	// Derive the effective value based on sign-in state and options
	const value = (() => {
		// Signed-in: Use Firestore > localStorage > default (normal hierarchy)
		if (user && userData?.preferences?.[key] !== undefined) {
			return userData.preferences[key];
		}
		if (user) {
			return localValue; // Firestore fallback when loading or disconnected
		}

		// Signed-out: Check persistForSignedOut flag
		if (options.persistForSignedOut) {
			return localValue; // Normal: remember localStorage value
		} else {
			return defaultValue; // Ephemeral: always show default
		}
	})();

	// Update function that saves to both localStorage AND Firestore
	const setValue = (newValue) => {
		setLocalValue(newValue);
		localStorage.setItem(storageKey, JSON.stringify(newValue));

		if (user) {
			updatePreferences({ [key]: newValue });
		}
	};

	return [value, setValue];
}
