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
 * @returns {[any, Function]} - [currentValue, setValue] tuple (like useState)
 *
 * Usage:
 *   // Normal preference (persists for everyone)
 *   const [darkMode, setDarkMode] = usePreference('darkMode', false);
 *
 *   // Context-scoped (e.g., resets to default for each new puzzle)
 *   const [showNumbers, setShowNumbers] = usePreference('showNumbers', true, { contextKey: puzzleId });
 */

import { useState, useEffect, useCallback } from "react";
import {
	doc,
	onSnapshot,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";
import { useAuth } from "./useAuth";

export function usePreference(key, defaultValue, options = {}) {
	const { contextKey = null } = options;
	const { user } = useAuth();
	const [value, setValue] = useState(defaultValue);
	const [loading, setLoading] = useState(true);

	// If contextKey is provided, scope the storage key (e.g., showNumbers_123 for puzzle 123)
	const storageKey = contextKey ? `${key}_${contextKey}` : key;

	// Subscribe to user's Firestore document for real-time updates
	useEffect(() => {
		if (!user?.uid) {
			setLoading(false);
			return;
		}

		const userDocRef = doc(db, "users", user.uid);

		// Real-time subscription to Firestore
		const unsubscribe = onSnapshot(
			userDocRef,
			(docSnap) => {
				if (!docSnap.exists()) {
					setValue(defaultValue);
					setLoading(false);
					return;
				}

				const userData = docSnap.data();
				const preferenceValue = userData?.preferences?.[storageKey];

				setValue(
					preferenceValue !== undefined
						? preferenceValue
						: defaultValue,
				);
				setLoading(false);
			},
			(error) => {
				console.error(
					"[usePreference] Error subscribing to preference:",
					error,
				);
				setValue(defaultValue);
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, [user?.uid, storageKey, defaultValue]);

	// Setter that saves to Firestore
	const setPreference = useCallback(
		async (newValue) => {
			if (!user?.uid) return;

			const userDocRef = doc(db, "users", user.uid);

			try {
				await updateDoc(userDocRef, {
					[`preferences.${storageKey}`]: newValue,
					updatedAt: serverTimestamp(),
				});
			} catch (error) {
				console.error(
					"[usePreference] Error saving preference:",
					error,
				);
				throw error;
			}
		},
		[user?.uid, storageKey],
	);

	return [value, setPreference, loading];
}
