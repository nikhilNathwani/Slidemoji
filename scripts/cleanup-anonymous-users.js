/**
 * cleanup-anonymous-users.js
 *
 * Deletes all anonymous Firebase Auth users and their Firestore user docs,
 * except for the one authenticated user you want to keep.
 *
 * Also clears the `savedGames` field on the kept user's doc so they can
 * start fresh with the new puzzle calendar.
 *
 * Run with: node scripts/cleanup-anonymous-users.js
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const KEEP_UID = "LWnLO2C3k2hJvNvkoNQWsKy0vWx1";
const USERS_COLLECTION = "users";

// ─── Load Admin SDK creds from .env.local ────────────────────────────────────

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return;
	const eqIdx = trimmed.indexOf("=");
	if (eqIdx === -1) return;
	const key = trimmed.slice(0, eqIdx).trim();
	const value = trimmed
		.slice(eqIdx + 1)
		.trim()
		.replace(/^"|"$/g, "");
	envVars[key] = value;
});

const privateKey = envVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (
	!envVars.FIREBASE_PROJECT_ID ||
	!envVars.FIREBASE_CLIENT_EMAIL ||
	!privateKey
) {
	console.error("❌ Missing Admin SDK credentials in .env.local");
	console.error(
		"Run: node scripts/import-firebase-key.js <service-account.json>",
	);
	process.exit(1);
}

// ─── Init Admin SDK ───────────────────────────────────────────────────────────

initializeApp({
	credential: cert({
		projectId: envVars.FIREBASE_PROJECT_ID,
		clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
		privateKey,
	}),
});

const adminAuth = getAuth();
const db = getFirestore();

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
	console.log(`\nKeeping UID: ${KEEP_UID}\n`);

	// 1. Collect all anonymous UIDs (paginated)
	const anonymousUids = [];
	let pageToken;
	do {
		const result = await adminAuth.listUsers(1000, pageToken);
		for (const user of result.users) {
			if (user.uid === KEEP_UID) continue;
			// Anonymous = no linked providers
			if (user.providerData.length === 0) {
				anonymousUids.push(user.uid);
			}
		}
		pageToken = result.pageToken;
	} while (pageToken);

	console.log(`Found ${anonymousUids.length} anonymous user(s) to delete.`);

	if (anonymousUids.length === 0) {
		console.log("Nothing to delete.");
	} else {
		// 2. Delete Auth accounts in batches of 1000 (API limit)
		for (let i = 0; i < anonymousUids.length; i += 1000) {
			const batch = anonymousUids.slice(i, i + 1000);
			const result = await adminAuth.deleteUsers(batch);
			console.log(
				`  Auth: deleted ${result.successCount}, failed ${result.failureCount}`,
			);
			if (result.errors.length > 0) {
				result.errors.forEach((e) =>
					console.error(`  ⚠️  ${e.index}: ${e.error.message}`),
				);
			}
		}

		// 3. Delete Firestore user docs in batches of 500 (Firestore commit limit)
		console.log("Deleting Firestore user docs...");
		for (let i = 0; i < anonymousUids.length; i += 500) {
			const batch = db.batch();
			anonymousUids.slice(i, i + 500).forEach((uid) => {
				batch.delete(db.collection(USERS_COLLECTION).doc(uid));
			});
			await batch.commit();
			console.log(
				`  Firestore: deleted docs ${i + 1}–${Math.min(i + 500, anonymousUids.length)}`,
			);
		}
	}

	// 4. Clear savedGames on the kept user's doc
	console.log(`\nClearing savedGames for ${KEEP_UID}...`);
	await db
		.collection(USERS_COLLECTION)
		.doc(KEEP_UID)
		.update({ savedGames: FieldValue.delete() });
	console.log("  ✅ savedGames cleared.");

	console.log("\nDone!\n");
}

run().catch((err) => {
	console.error("❌ Script failed:", err);
	process.exit(1);
});
