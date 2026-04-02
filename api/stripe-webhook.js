import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

// Vercel/Node.js: disable automatic body parsing so we get the raw bytes.
// Stripe signature verification REQUIRES the raw unparsed body — if Vercel's
// built-in body parser runs first, the stream is already consumed and
// constructEvent() will throw a signature error even with the correct secret.
export const config = {
	api: {
		bodyParser: false,
	},
};

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
				privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
					/\\n/g,
					"\n",
				),
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
	console.log("[stripe-webhook] Request received:", req.method);

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Diagnose missing env vars immediately — each one has a distinct log
	const envStatus = {
		STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
		FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
		FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
		FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
	};
	console.log("[stripe-webhook] Env vars present:", envStatus);
	const missingVars = Object.entries(envStatus)
		.filter(([, present]) => !present)
		.map(([key]) => key);
	if (missingVars.length > 0) {
		console.error("[stripe-webhook] Missing env vars:", missingVars);
		return res
			.status(500)
			.json({ error: `Missing env vars: ${missingVars.join(", ")}` });
	}

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
	const rawBody = await readRawBody(req);
	console.log("[stripe-webhook] Raw body length:", rawBody.length);

	const signature = req.headers["stripe-signature"];
	console.log("[stripe-webhook] Signature header present:", !!signature);

	// In test/dev mode with an empty raw body (can happen when vercel dev
	// pre-parses the request), fall back to req.body directly and skip
	// signature verification. This is safe locally — you are the one
	// generating the test events via `stripe listen`. In production, the raw
	// body is always present and verification is always enforced.
	const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
	const bodyIsEmpty = rawBody.length === 0;

	let event;
	if (isTestMode && bodyIsEmpty && req.body) {
		// vercel dev already parsed the body — use it directly
		console.log(
			"[stripe-webhook] DEV: raw body empty, using pre-parsed req.body (sig verification skipped)",
		);
		event = req.body;
	} else {
		try {
			event = stripe.webhooks.constructEvent(
				rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET,
			);
			console.log("[stripe-webhook] Event verified:", event.type);
		} catch (err) {
			console.error(
				"[stripe-webhook] Signature verification failed:",
				err.message,
			);
			console.error(
				"[stripe-webhook] Raw body length was:",
				rawBody.length,
				"— if 0, vercel dev consumed the stream.",
			);
			return res.status(400).json({ error: "Webhook signature invalid" });
		}
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object;
		const firebaseUid = session.metadata?.firebaseUid;
		console.log("[stripe-webhook] firebaseUid from metadata:", firebaseUid);

		if (!firebaseUid) {
			console.error(
				"[stripe-webhook] Missing firebaseUid in session metadata",
			);
			return res
				.status(400)
				.json({ error: "Missing firebaseUid in session metadata" });
		}

		let db;
		try {
			db = getAdminDb();
		} catch (err) {
			console.error(
				"[stripe-webhook] Firebase Admin init failed:",
				err.message,
			);
			console.error(
				"[stripe-webhook] Check FIREBASE_PRIVATE_KEY — it must include",
				"the full PEM header/footer and use literal \\\\n for newlines.",
			);
			return res
				.status(500)
				.json({ error: "Firebase Admin initialization failed" });
		}

		try {
			await db.collection("users").doc(firebaseUid).update({
				isPremium: true,
				premiumGrantedAt: new Date().toISOString(),
			});
			console.log(
				`[stripe-webhook] ✅ Premium granted to user ${firebaseUid}`,
			);
		} catch (err) {
			console.error(
				"[stripe-webhook] Firestore update failed:",
				err.message,
			);
			return res
				.status(500)
				.json({ error: "Failed to update user record" });
		}
	} else {
		console.log("[stripe-webhook] Unhandled event type:", event.type);
	}

	return res.status(200).json({ received: true });
}
