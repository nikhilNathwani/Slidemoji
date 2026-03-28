/**
 * useUser - Get user data from Firestore with real-time updates
 *
 * Uses Firestore's onSnapshot for real-time updates (no React Query needed).
 * Everyone uses Firestore (anonymous or Google via Firebase Anonymous Auth).
 *
 * @param {string} userId - Firebase user ID
 * @returns {Object} - { data, loading, error }
 */

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

export function useUser(userId) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!userId) {
			setData(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		const userDocRef = doc(db, "users", userId);

		// Real-time subscription to Firestore
		const unsubscribe = onSnapshot(
			userDocRef,
			(docSnap) => {
				if (!docSnap.exists()) {
					setData(null);
					setLoading(false);
					return;
				}

				const userData = docSnap.data();
				setData(userData);
				setLoading(false);
			},
			(err) => {
				console.error("[useUser] Error subscribing to user data:", err);
				setError(err);
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, [userId]);

	return { data, loading, error };
}
