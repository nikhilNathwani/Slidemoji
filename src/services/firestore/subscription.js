/**
 * subscription.js - Firestore read/write for premium subscription status
 *
 * isPremium is set server-side only (via Firebase Admin SDK in the Stripe webhook).
 * Firestore security rules prevent clients from self-granting premium.
 *
 * Client code should use useSubscription() to read status reactively
 * (it comes through the existing UserDoc onSnapshot stream — no extra listener needed).
 *
 * Server-side webhook flow (to be implemented):
 *   Stripe checkout.session.completed
 *     → Firebase Function / Vercel API route
 *     → setUserPremiumStatus(uid, true)   (called with Admin SDK, bypasses rules)
 *
 *   Stripe customer.subscription.deleted
 *     → setUserPremiumStatus(uid, false)
 */

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Grant or revoke premium for a user.
 * Must be called with Firebase Admin SDK (server-side only — bypasses security rules).
 * Never call this from client code.
 */
export async function setUserPremiumStatus(userId, isPremium) {
	if (!userId) throw new Error("User ID is required");
	if (typeof isPremium !== "boolean")
		throw new Error("isPremium must be a boolean");

	const userDocRef = doc(db, "users", userId);
	await updateDoc(userDocRef, {
		isPremium,
		updatedAt: serverTimestamp(),
	});
}
