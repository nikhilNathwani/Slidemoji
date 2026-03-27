/**
 * usePreference - Manage preferences that sync between localStorage and Firestore
 *
 * Uses React Query for automatic reactivity and optimistic updates.
 * Firestore offline persistence handles sync automatically.
 *
 * @param {string} key - The preference key (e.g., 'darkMode', 'soundEnabled', 'difficulty')
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

import { useEffect, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useUser } from "./useUser";
import {
	getAnonymousPreference,
	setAnonymousPreference,
} from "../storage/anonymous";
import { updateUserPreferencesToFirestore } from "../storage/firestore";

export function usePreference(key, defaultValue, options = {}) {
	// Merge with defaults
	const { persistForSignedOut = true, contextKey = null } = options;

	const { user } = useAuth();
	const { data: userData } = useUser(user?.uid);
	const queryClient = useQueryClient();

	// If contextKey is provided, scope the storage key (e.g., showNumbers_123 for puzzle 123)
	const storageKey = contextKey ? `${key}_${contextKey}` : key;

	// Derive the current value based on sign-in state and options
	// React Query handles reactivity automatically
	const value = useMemo(() => {
		// Signed-in: Use Firestore > localStorage > default
		if (user && userData?.preferences?.[key] !== undefined) {
			return userData.preferences[key];
		}
		if (user) {
			// Fallback when loading: read from localStorage
			return getAnonymousPreference(storageKey, defaultValue);
		}

		// Signed-out: Check persistForSignedOut flag
		if (persistForSignedOut) {
			return getAnonymousPreference(storageKey, defaultValue);
		} else {
			return defaultValue; // Ephemeral: always show default
		}
	}, [key, userData, user, defaultValue, persistForSignedOut, storageKey]);

	// Sync Firestore → localStorage when signed-in user data loads
	// This ensures cross-device sync: if you change settings on device A,
	// then sign in on device B, localStorage on B gets updated so when you
	// sign out, you keep the settings from device A.
	useEffect(() => {
		if (user && userData?.preferences?.[key] !== undefined) {
			const firestoreValue = userData.preferences[key];
			const currentLocalValue = getAnonymousPreference(
				storageKey,
				defaultValue,
			);
			// Only update if different (avoid unnecessary writes)
			if (firestoreValue !== currentLocalValue) {
				setAnonymousPreference(storageKey, firestoreValue);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, userData?.preferences?.[key], key, storageKey, defaultValue]);

	// Mutation for saving preferences with optimistic updates
	const mutation = useMutation({
		mutationFn: async (newValue) => {
			// Always save to localStorage (for fallback and anonymous users)
			setAnonymousPreference(storageKey, newValue);

			// If signed in, also save to Firestore
			if (user) {
				await updateUserPreferencesToFirestore(user.uid, {
					[key]: newValue,
				});
			}
		},
		// Optimistic update: UI updates IMMEDIATELY
		onMutate: async (newValue) => {
			if (user) {
				// Cancel any outgoing refetches
				await queryClient.cancelQueries({
					queryKey: ["userData", user.uid],
				});

				// Optimistically update the userData cache
				queryClient.setQueryData(["userData", user.uid], (oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						preferences: {
							...(oldData.preferences || {}),
							[key]: newValue,
						},
					};
				});
			}
			// For anonymous users, localStorage.setItem is synchronous,
			// so the next render will pick up the new value automatically
		},
		// If mutation fails, React Query will automatically refetch
	});

	// Update function
	const setValue = useCallback(
		(newValue) => {
			mutation.mutate(newValue);
		},
		[mutation],
	);

	return [value, setValue];
}
