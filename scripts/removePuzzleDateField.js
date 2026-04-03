/**
 * Script to remove the `date` field from all puzzle documents in Firestore.
 *
 * The `date` field stores e.g. "2026-01-01" and is derivable from `id`. It was
 * written during the initial upload but is never read back by the app, so it's
 * dead weight on every puzzle document.
 *
 * Uses the Firebase Admin SDK because the puzzles collection is client-write-
 * protected (`allow write: if false` in firestore.rules).
 *
 * Run with:
 *   node scripts/removePuzzleDateField.js            # live run
 *   node scripts/removePuzzleDateField.js --dry-run  # preview only
 *
 * Requires .env.local with:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, "../.env.local");
let envFile;
try {
	envFile = readFileSync(envPath, "utf-8");
} catch (error) {
	console.error("❌ Error: Could not read .env.local file");
	console.error("Path:", envPath);
	console.error("Error:", error.message);
	process.exit(1);
}

const envVars = {};
envFile.split("\n").forEach((line) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return;
	const [key, ...valueParts] = trimmed.split("=");
	if (key && valueParts.length) {
		envVars[key.trim()] = valueParts.join("=").trim();
	}
});

if (
	!envVars.FIREBASE_PROJECT_ID ||
	!envVars.FIREBASE_CLIENT_EMAIL ||
	!envVars.FIREBASE_PRIVATE_KEY
) {
	console.error("❌ Error: Missing Firebase Admin credentials in .env.local");
	console.error(
		"  Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
	);
	console.error(
		"  Run: npm run import-firebase-key ~/Downloads/firebase-key.json",
	);
	process.exit(1);
}

// Initialize Firebase Admin
initializeApp({
	credential: cert({
		projectId: envVars.FIREBASE_PROJECT_ID,
		clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
		// .env.local stores literal \n; unescape to real newlines for the PEM key
		privateKey: envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
	}),
});

const db = getFirestore();
const BATCH_SIZE = 500; // Firestore batch write limit

async function main() {
	const isDryRun = process.argv.includes("--dry-run");
	if (isDryRun) {
		console.log("🔍 DRY RUN — no changes will be written\n");
	}

	console.log("Fetching all puzzle documents...");
	const snapshot = await db.collection("puzzles").get();
	console.log(`Found ${snapshot.size} puzzle documents\n`);

	const docsWithDate = snapshot.docs.filter((doc) => "date" in doc.data());
	console.log(`Docs with 'date' field: ${docsWithDate.length}`);

	if (docsWithDate.length === 0) {
		console.log("\n✓ Nothing to do — no documents have a 'date' field.");
		process.exit(0);
	}

	if (isDryRun) {
		const sample = docsWithDate.slice(0, 3).map((d) => ({
			id: d.id,
			date: d.data().date,
		}));
		console.log("\nSample docs that would be updated:", sample);
		console.log(
			`\n✓ DRY RUN: Would remove 'date' from ${docsWithDate.length} of ${snapshot.size} documents.`,
		);
		console.log("  Run without --dry-run to apply.");
		process.exit(0);
	}

	// Process in batches of 500
	let updatedCount = 0;
	for (let i = 0; i < docsWithDate.length; i += BATCH_SIZE) {
		const chunk = docsWithDate.slice(i, i + BATCH_SIZE);
		const batch = db.batch();
		for (const docSnapshot of chunk) {
			batch.update(docSnapshot.ref, { date: FieldValue.delete() });
		}
		await batch.commit();
		updatedCount += chunk.length;
		console.log(
			`  Processed ${updatedCount} / ${docsWithDate.length} documents...`,
		);
	}

	console.log(
		`\n✓ Removed 'date' field from ${updatedCount} puzzle documents.`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
