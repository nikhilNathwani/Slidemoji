#!/usr/bin/env node
/**
 * One-off script: grant (or revoke) isPremium on a Firestore user doc.
 *
 * Usage:
 *   node scripts/grant-premium.js <uid> [--revoke]
 *
 * Requires a service account key exported from Firebase Console:
 *   Project settings → Service accounts → Generate new private key → save as
 *   scripts/service-account-key.json   (already git-ignored)
 */
import { readFileSync } from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const uid = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!uid) {
	console.error("Usage: node scripts/grant-premium.js <uid> [--revoke]");
	process.exit(1);
}

const keyPath = new URL("./service-account-key.json", import.meta.url)
	.pathname;

let serviceAccount;
try {
	serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
	console.error(
		"Could not read scripts/service-account-key.json\n" +
			"Download it from Firebase Console → Project settings → Service accounts → Generate new private key",
	);
	process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const isPremium = !revoke;
await db.collection("users").doc(uid).update({
	isPremium,
	premiumGrantedAt: isPremium ? new Date().toISOString() : null,
});

console.log(
	`✅ User ${uid} isPremium=${isPremium} (premiumGrantedAt updated)`,
);
process.exit(0);
