import { useState } from "react";
import { useAuth } from "../auth/useAuth";

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
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [error, setError] = useState(null);

	async function startCheckout() {
		if (!user) {
			setError("You must be signed in to upgrade.");
			return;
		}

		setIsRedirecting(true);
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

			// Parse JSON safely — a non-JSON response (e.g. 404 from Vite dev server
			// when API routes aren't served) would otherwise throw an opaque error.
			let data;
			try {
				data = await res.json();
			} catch {
				throw new Error(
					`Server returned an unexpected response (${res.status}). ` +
						"API routes require \'vercel dev\' locally.",
				);
			}

			if (!res.ok) {
				throw new Error(data.error ?? "Checkout failed");
			}

			// Redirect to Stripe's hosted checkout page
			window.location.href = data.url;
		} catch (err) {
			setError(err.message);
			setIsRedirecting(false);
		}
	}

	return { startCheckout, isRedirecting, error };
}
