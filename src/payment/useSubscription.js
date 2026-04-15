/**
 * useSubscription - React hook for reading the user's premium status
 *
 * Reads isPremium from the existing UserDoc onSnapshot stream.
 * No extra Firestore listener — zero overhead.
 *
 * Usage:
 *   const { isPremium, loading } = useSubscription();
 *   if (isPremium) { ... }
 */

import { useUserDoc } from "../hooks/useUserDoc";

export function useSubscription() {
	const { userDoc, isLoading } = useUserDoc();

	return {
		isPremium: userDoc?.isPremium === true,
		isLoading,
	};
}
