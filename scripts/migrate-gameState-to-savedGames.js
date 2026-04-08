/**
 * Migration: rename Firestore field `gameState` → `savedGames` on all user docs.
 *
 * Run with: node scripts/migrate-gameState-to-savedGames.js
 * (Requires .env.local with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 *
 * Safe to re-run: docs that already have `savedGames` and no `gameState` are skipped.
 */

import { default as admin } from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Load .env.local ─────────────────────────────────────────────────────────

const envPath = join(__dirname, "../.env.local");
let envFile;
try {
	envFile = readFileSync(envPath, "utf-8");
} catch {
	console.error("❌ Could not read .env.local — is it present at the root?");
	process.exit(1);
}

const envVars = {};
envFile.split("\n").forEach((line) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return;
	const [key, ...valueParts] = trimmed.split("=");
	if (key && valueParts.length)
		envVars[key.trim()] = valueParts.join("=").trim();
});

const projectId = envVars.FIREBASE_PROJECT_ID;
const clientEmail = envVars.FIREBASE_CLIENT_EMAIL;
// .env.local stores the key with escaped \n and surrounding quotes — parse both.
const privateKey = envVars.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(
	/\\n/g,
	"\n",
);

if (!projectId || !clientEmail || !privateKey) {
	console.error(
		"❌ Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env.local",
	);
	process.exit(1);
}

// ─── Init Admin SDK ───────────────────────────────────────────────────────────

admin.initializeApp({
	credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

// ─── Migration ────────────────────────────────────────────────────────────────

async function migrate() {
	console.log("📖 Reading all user docs...");
	const usersSnap = await db.collection("users").get();
	console.log(`   Found ${usersSnap.size} user docs\n`);

	let migrated = 0;
	let skipped = 0;

	// Firestore batches are limited to 500 ops; each doc needs 2 field ops.
	const BATCH_SIZE = 200;
	let batch = db.batch();
	let opsInBatch = 0;

	const flush = async () => {
		if (opsInBatch > 0) {
			await batch.commit();
			batch = db.batch();
			opsInBatch = 0;
		}
	};

	for (const snap of usersSnap.docs) {
		const data = snap.data();
		const hasOldField = "gameState" in data;
		const hasNewField = "savedGames" in data;

		if (!hasOldField) {
			// Already migrated or never had game data — skip.
			skipped++;
			continue;
		}

		const docRef = db.collection("users").doc(snap.id);

		if (!hasNewField) {
			// Copy gameState → savedGames, then delete gameState.
			batch.update(docRef, {
				savedGames: data.gameState,
				gameState: admin.firestore.FieldValue.delete(),
			});
		} else {
			// savedGames already exists — just remove the stale gameState field.
			batch.update(docRef, {
				gameState: admin.firestore.FieldValue.delete(),
			});
		}

		opsInBatch++;
		migrated++;

		if (opsInBatch >= BATCH_SIZE) {
			await flush();
			console.log(`   ↳ Committed batch (${migrated} docs so far)...`);
		}
	}

	await flush();

	console.log(`\n✅ Migration complete`);
	console.log(`   Migrated : ${migrated}`);
	console.log(`   Skipped  : ${skipped} (already up-to-date)`);
	process.exit(0);
}

migrate().catch((err) => {
	console.error("❌ Migration failed:", err);
	process.exit(1);
});
