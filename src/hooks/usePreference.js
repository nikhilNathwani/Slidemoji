/**
 * usePreference - Manage preferences that sync between localStorage and Firestore
 *
 * This hook abstracts the pattern of storing preferences in localStorage for signed-out users
 * and syncing them to Firestore for signed-in users (for cross-device sync).
 *
 * @param {string} key - The preference key (e.g., 'darkMode', 'soundEnabled', 'gridSize')
 * @param {*} defaultValue - The default value if no saved preference exists
 * @param {Object} options - Optional configuration
 * @param {boolean} [options.persistForSignedOut=true] - Whether signed-out users should see their localStorage value
 * @param {string} [options.contextKey=null] - Optional key to scope this preference (e.g., puzzleId for daily reset)
 * @returns {[any, Function]} - [currentValue, setValue] tuple (like useState)
 *
 * Usage:
 *   // Normal preference (persists for everyone)
 *   const [darkMode, setDarkMode] = usePreference('darkMode', false);
 *
 *   // Ephemeral for signed-out users (always shows default, but localStorage used as Firestore fallback for signed-in)
 *   const [gridSize, setGridSize] = usePreference('gridSize', 3, { persistForSignedOut: false });
 *
 *   // Context-scoped (e.g., resets to default for each new puzzle)
 *   const [showNumbers, setShowNumbers] = usePreference('showNumbers', true, { contextKey: puzzleId });
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useUser } from "./useUser";
import { updateUserPreferences } from "../backend/database";

export function usePreference(key, defaultValue, options = {}) {
	// Merge with defaults
	const { persistForSignedOut = true, contextKey = null } = options;

	const { user } = useAuth();
	const { data: userData } = useUser(user?.uid);
	const queryClient = useQueryClient();

	// React Query mutation for updating preferences in Firestore
	const updatePreferencesMutation = useMutation({
		mutationFn: (preferences) => {
			if (!user?.uid) {
				throw new Error(
					"Cannot update preferences: user not signed in",
				);
			}
			return updateUserPreferences(user.uid, preferences);
		},
		onMutate: async (newPreferences) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["user", user?.uid],
			});

			// Snapshot the previous value for rollback
			const previousUserData = queryClient.getQueryData([
				"user",
				user?.uid,
			]);

			// Optimistically update the cache
			queryClient.setQueryData(["user", user?.uid], (old) => ({
				...old,
				preferences: {
					...old?.preferences,
					...newPreferences,
				},
			}));

			return { previousUserData };
		},
		onError: (error, newPreferences, context) => {
			console.error("Error updating preferences:", error);
			// Rollback on error
			if (context?.previousUserData) {
				queryClient.setQueryData(
					["user", user?.uid],
					context.previousUserData,
				);
			}
		},
	});

	// If contextKey is provided, scope the storage key (e.g., showNumbers_123 for puzzle 123)
	const storageKey = contextKey ? `${key}_${contextKey}` : key;

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
		if (persistForSignedOut) {
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
			updatePreferencesMutation.mutate({ [key]: newValue });
		}
	};

	return [value, setValue];
}
