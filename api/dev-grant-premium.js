import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Dev-only endpoint: grants isPremium via Admin SDK (bypasses Firestore rules).
// Blocked in production (live Stripe key). Only works with sk_test_ keys.

function getAdminDb() {
	if (getApps().length === 0) {
		initializeApp({
			credential: cert({
				projectId: process.env.FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
				privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
					/\\n/g,
					"\n",
				),
			}),
		});
	}
	return getFirestore();
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Hard block in production — live key means real users
	if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
		return res.status(403).json({ error: "Not available in production" });
	}

	const { uid } = req.body;
	if (!uid) {
		return res.status(400).json({ error: "uid required" });
	}

	try {
		const db = getAdminDb();
		const docRef = db.collection("users").doc(uid);

		// After sign-out a new anonymous user is created, but syncFirestoreUserData
		// runs async and may not have written the doc yet. Retry a few times.
		for (let attempt = 0; attempt < 5; attempt++) {
			const snap = await docRef.get();
			if (snap.exists) {
				await docRef.update({ isPremium: true });
				return res.status(200).json({ success: true });
			}
			await new Promise((r) => setTimeout(r, 400));
		}

		return res
			.status(404)
			.json({ error: "User doc not found — try again in a moment" });
	} catch (error) {
		console.error("[dev-grant-premium] Error:", error.message);
		return res.status(500).json({ error: error.message });
	}
}
