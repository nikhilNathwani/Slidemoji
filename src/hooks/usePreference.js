/**
 * usePreference - Manage user preferences with Firestore real-time sync
 *
 * Uses Firestore's onSnapshot for real-time updates (no React Query needed).
 * Everyone uses Firestore (anonymous or Google via Firebase Anonymous Auth).
 *
 * @param {string} key - The preference key (e.g., 'darkMode', 'soundEnabled', 'difficulty')
 * @param {*} defaultValue - The default value if no saved preference exists
 * @param {Object} options - Optional configuration
 * @param {string} [options.contextKey=null] - Optional key to scope this preference (e.g., puzzleId for daily reset)
 * @returns {[any, Function]} - [preference, setPreference] tuple (like useState)
 *
 * Usage:
 *   // Normal preference (persists for everyone)
 *   const [darkMode, setDarkMode] = usePreference('darkMode', false);
 *
 *   // Context-scoped (e.g., resets to default for each new puzzle)
 *   const [showNumbers, setShowNumbers] = usePreference('showNumbers', true, { contextKey: puzzleId });
 */

import { useCallback } from "react";
import { updateFirestorePreferences } from "../services/firestore/preference";
import { useAuth } from "./useAuth";
import { useUserDoc } from "./useUserDoc";
import { DEFAULT_DIFFICULTY } from "../constants";

// Defaults live here so callers never need to import or pass them.
const PREFERENCE_DEFAULTS = {
	darkMode:
		window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
	soundEnabled: false,
	showNumbers: true,
	difficulty: DEFAULT_DIFFICULTY,
};

export function usePreference(key, defaultValue, options = {}) {
	// Use the caller-supplied default, or fall back to the built-in default.
	const resolvedDefault = defaultValue ?? PREFERENCE_DEFAULTS[key];
	const { contextKey = null } = options;
	const { user } = useAuth();
	const { userDoc } = useUserDoc();
	const userId = user?.uid || null;

	// If contextKey is provided, scope the storage key (e.g., showNumbers_123 for puzzle 123)
	const storageKey = contextKey ? `${key}_${contextKey}` : key;

	// Setter that saves to Firestore
	const setPreference = useCallback(
		async (newValue) => {
			// Always mirror to localStorage (non-contextKey prefs only) so the
			// value survives sign-out / new-anonymous-user creation.
			if (!contextKey) {
				try {
					localStorage.setItem(
						`pref_${key}`,
						JSON.stringify(newValue),
					);
					// Notify same-window listeners immediately (e.g. theme toggle bypasses Firestore round-trip)
					window.dispatchEvent(
						new CustomEvent("preference-updated", {
							detail: { key, value: newValue },
						}),
					);
				} catch {
					/* localStorage may be unavailable; best-effort */
				}
			}

			if (!userId) return;

			try {
				await updateFirestorePreferences(userId, {
					[storageKey]: newValue,
				});
			} catch (error) {
				console.error(
					"[usePreference] Error saving preference:",
					error,
				);
				throw error;
			}
		},
		[userId, storageKey, key, contextKey],
	);

	const preferenceValue = userDoc?.preferences?.[storageKey];

	// Priority: Firestore (signed-in) → localStorage fallback → built-in default
	const preference = (() => {
		if (userId && preferenceValue !== undefined) return preferenceValue;
		if (!contextKey) {
			try {
				const stored = localStorage.getItem(`pref_${key}`);
				if (stored !== null) return JSON.parse(stored);
			} catch {
				/* localStorage may be unavailable; best-effort */
			}
		}
		return resolvedDefault;
	})();

	return [preference, setPreference];
}
