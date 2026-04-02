import Stripe from "stripe";

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout session for the premium upgrade.
 * Returns { url } — redirect the user to this URL to complete payment.
 *
 * Body: { uid: string, returnUrl: string }
 *
 * After successful payment, Stripe calls /api/stripe-webhook which
 * sets isPremium: true on the user's Firestore doc.
 */
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { uid, returnUrl } = req.body ?? {};

	if (!uid || typeof uid !== "string") {
		return res.status(400).json({ error: "uid is required" });
	}
	if (!returnUrl || typeof returnUrl !== "string") {
		return res.status(400).json({ error: "returnUrl is required" });
	}

	if (!process.env.STRIPE_SECRET_KEY) {
		return res.status(500).json({ error: "Stripe is not configured" });
	}

	// Log key mode (test vs live) to help diagnose env var issues
	console.log("[create-checkout-session] Key mode:", process.env.STRIPE_SECRET_KEY.slice(0, 9));
	console.log("[create-checkout-session] Price ID:", process.env.STRIPE_PRICE_ID);
	console.log("[create-checkout-session] uid:", uid);

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment", // one-time purchase; change to "subscription" for recurring
			payment_method_types: ["card"],
			line_items: [
				{
					price: process.env.STRIPE_PRICE_ID,
					quantity: 1,
				},
			],
			metadata: {
				// Stored on the session so the webhook can find the right Firestore user
				firebaseUid: uid,
			},
			success_url: `${returnUrl}?payment=success`,
			cancel_url: `${returnUrl}?payment=cancelled`,
		});

		return res.status(200).json({ url: session.url });
	} catch (err) {
		console.error("Stripe create-checkout-session error:", err.message);
		return res
			.status(500)
			.json({ error: "Failed to create checkout session" });
	}
}
