/**
 * One-off patch: update emoji/emojiName on specific puzzle docs in Firestore
 * to reflect a reordering of emoji_calendar.json without regenerating grids.
 *
 * Run with: node scripts/patch-puzzle-emojis.js
 *
 * Reads credentials from .env.local (same as uploadPuzzles.js).
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load emoji calendar
const emojiCalendar = JSON.parse(
	readFileSync(join(__dirname, "../data/emoji_calendar.json"), "utf-8"),
);

// Load .env.local
const envPath = join(__dirname, "../.env.local");
let envFile;
try {
	envFile = readFileSync(envPath, "utf-8");
} catch {
	console.error("❌ Could not read .env.local");
	process.exit(1);
}

const envVars = {};
envFile.split("\n").forEach((line) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return;
	const [key, ...valueParts] = trimmed.split("=");
	if (key && valueParts.length)
		envVars[key.trim()] = valueParts.join("=").trim().replace(/^"|"$/g, "");
});

const privateKey = envVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (
	!envVars.FIREBASE_PROJECT_ID ||
	!envVars.FIREBASE_CLIENT_EMAIL ||
	!privateKey
) {
	console.error("❌ Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local");
	process.exit(1);
}

const app = initializeApp({
	credential: cert({
		projectId: envVars.FIREBASE_PROJECT_ID,
		clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
		privateKey,
	}),
});
const db = getFirestore(app);

// Puzzle IDs whose emoji has changed (1-based, maps to emojiCalendar[puzzleId - 1])
// Puzzle 1: 😂 → 🐶 | Puzzle 2: unchanged | Puzzle 3: 🐶 → 😂
const PUZZLE_IDS_TO_PATCH = [1, 3];

console.log("🔧 Patching puzzle emoji fields...\n");

for (const puzzleId of PUZZLE_IDS_TO_PATCH) {
	const emojiIndex = (puzzleId - 1) % emojiCalendar.length;
	const { emoji, name } = emojiCalendar[emojiIndex];
	const ref = db.collection("puzzles").doc(puzzleId.toString());
	await ref.update({ emoji, emojiName: name });
	console.log(`✅ Puzzle ${puzzleId}: ${emoji} ${name}`);
}

console.log("\nDone. Grids (normal/hard) were not modified.");
process.exit(0);
