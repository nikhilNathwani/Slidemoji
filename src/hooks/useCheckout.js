import { useState } from "react";
import { useAuth } from "./useAuth";

/**
 * useCheckout - initiates a Stripe Checkout session for the premium upgrade.
 *
 * Usage:
 *   const { startCheckout, isLoading, error } = useCheckout();
 *   <button onClick={startCheckout} disabled={isLoading}>Go Premium</button>
 *
 * Flow:
 *   1. POST /api/create-checkout-session with the user's Firebase UID
 *   2. Receive the Stripe Checkout URL
 *   3. Redirect the user to Stripe's hosted checkout page
 *   4. After payment, Stripe calls /api/stripe-webhook
 *   5. Webhook sets isPremium: true on the user's Firestore doc
 *   6. useSubscription() picks up the change via the existing onSnapshot stream
 *
 * Test card (Stripe test mode): 4242 4242 4242 4242, any future date, any CVC
 */
export function useCheckout() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	async function startCheckout() {
		if (!user) {
			setError("You must be signed in to upgrade.");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/create-checkout-session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					uid: user.uid,
					returnUrl: window.location.origin,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error ?? "Checkout failed");
			}

			// Redirect to Stripe's hosted checkout page
			window.location.href = data.url;
		} catch (err) {
			setError(err.message);
			setIsLoading(false);
		}
	}

	return { startCheckout, isLoading, error };
}
