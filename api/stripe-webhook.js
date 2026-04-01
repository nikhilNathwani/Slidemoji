import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe events and updates Firestore accordingly.
 * Must receive the raw (unparsed) request body for signature verification.
 *
 * Handled events:
 *   checkout.session.completed → sets isPremium: true on the user doc
 *
 * Environment variables required (server-side only, never prefix with VITE_):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET     — from Stripe Dashboard > Webhooks
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      — include the full key with literal \n newlines
 */

// Initialize Firebase Admin once per cold start (Vercel reuses instances)
function getAdminDb() {
	if (getApps().length === 0) {
		initializeApp({
			credential: cert({
				projectId: process.env.FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
				// Vercel stores private keys with escaped newlines; unescape them
				privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
			}),
		});
	}
	return getFirestore();
}

// Vercel's Node.js runtime does not pre-parse the body for serverless functions,
// so we can read the raw bytes directly from the request stream — exactly what
// Stripe needs to verify the webhook signature.
function readRawBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on("data", (chunk) => chunks.push(chunk));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
	const rawBody = await readRawBody(req);
	const signature = req.headers["stripe-signature"];

	let event;
	try {
		event = stripe.webhooks.constructEvent(
			rawBody,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		// Invalid signature — reject silently so we don't reveal internals
		console.error("Stripe webhook signature verification failed:", err.message);
		return res.status(400).json({ error: "Webhook signature invalid" });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object;
		const firebaseUid = session.metadata?.firebaseUid;

		if (!firebaseUid) {
			console.error("checkout.session.completed: missing firebaseUid in metadata");
			return res.status(400).json({ error: "Missing firebaseUid in session metadata" });
		}

		const db = getAdminDb();
		await db.collection("users").doc(firebaseUid).update({
			isPremium: true,
			premiumGrantedAt: new Date().toISOString(),
		});

		console.log(`Premium granted to user ${firebaseUid}`);
	}

	// Always return 200 — Stripe will retry if we return an error
	return res.status(200).json({ received: true });
}
