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

import { useUserDoc } from "./useUserDoc";

export function useSubscription() {
	const { userData, loading } = useUserDoc();

	return {
		isPremium: userData?.isPremium === true,
		loading,
	};
}
