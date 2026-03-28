/**
 * Script to upload 1096 puzzles to Firestore
 *
 * Run with: node scripts/uploadPuzzles.js
 * (Make sure you have .env.local with Firebase credentials)
 *
 * This creates one puzzle for each day from 2026-2028 (3 years including leap year),
 * using the emoji calendar and generating scrambled grids for both 3x3 and 4x4 difficulties.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load emoji calendar
const emojiCalendar = JSON.parse(
	readFileSync(join(__dirname, "../data/emoji_calendar.json"), "utf-8"),
);

// Load .env.local file manually
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

console.log("Loaded environment variables:", Object.keys(envVars));

// Firebase configuration
const firebaseConfig = {
	apiKey: envVars.VITE_FIREBASE_API_KEY,
	authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: envVars.VITE_FIREBASE_PROJECT_ID,
	storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: envVars.VITE_FIREBASE_APP_ID,
};

// Check for Firebase config
if (!firebaseConfig.apiKey) {
	console.error("❌ Error: Firebase configuration not found!");
	console.error(
		"Make sure you have a .env.local file with your Firebase credentials.",
	);
	console.error("\nRequired variables:");
	console.error("  VITE_FIREBASE_API_KEY");
	console.error("  VITE_FIREBASE_AUTH_DOMAIN");
	console.error("  VITE_FIREBASE_PROJECT_ID");
	console.error("  VITE_FIREBASE_STORAGE_BUCKET");
	console.error("  VITE_FIREBASE_MESSAGING_SENDER_ID");
	console.error("  VITE_FIREBASE_APP_ID\n");
	process.exit(1);
}

console.log("Firebase config loaded successfully ✓\n");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Scramble puzzle grid - creates a solvable random configuration
 * Ensures the gap always ends up in the bottom-right corner
 * Grid uses 1-8 for tiles and 0 for gap (Firestore format)
 * (Same logic as src/utils/gridHelpers.js)
 */
function scramblePuzzle(size) {
	const totalTiles = size * size;
	// Initialize with solved state: [1, 2, 3, 4, 5, 6, 7, 8, 0] for 3x3
	const grid = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1).concat(
		0,
	);
	const bottomRightIndex = totalTiles - 1;

	// Perform 500 random valid moves to ensure solvability
	let emptyIndex = totalTiles - 1; // Gap starts at bottom-right

	for (let i = 0; i < 500; i++) {
		const validMoves = [];
		const row = Math.floor(emptyIndex / size);
		const col = emptyIndex % size;

		// Check all 4 directions for valid moves
		if (row > 0) validMoves.push(emptyIndex - size); // Up
		if (row < size - 1) validMoves.push(emptyIndex + size); // Down
		if (col > 0) validMoves.push(emptyIndex - 1); // Left
		if (col < size - 1) validMoves.push(emptyIndex + 1); // Right

		// Pick random valid move
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		// Swap
		[grid[emptyIndex], grid[randomMove]] = [
			grid[randomMove],
			grid[emptyIndex],
		];
		emptyIndex = randomMove;
	}

	// Ensure gap ends up in bottom-right corner
	while (emptyIndex !== bottomRightIndex) {
		const row = Math.floor(emptyIndex / size);
		const col = emptyIndex % size;
		const targetRow = size - 1;
		const targetCol = size - 1;

		let nextIndex;

		// Prioritize moving down, then right
		if (row < targetRow) {
			// Move gap down (swap with tile below)
			nextIndex = emptyIndex + size;
		} else if (col < targetCol) {
			// Move gap right (swap with tile to the right)
			nextIndex = emptyIndex + 1;
		} else {
			// Should not reach here, but break to prevent infinite loop
			break;
		}

		// Swap
		[grid[emptyIndex], grid[nextIndex]] = [
			grid[nextIndex],
			grid[emptyIndex],
		];
		emptyIndex = nextIndex;
	}

	return grid;
}

/**
 * Generate a puzzle for a specific day
 */
function generatePuzzle(puzzleId) {
	// Calculate date (Jan 1, 2026 + (puzzleId - 1) days)
	const startDate = new Date("2026-01-01");
	const puzzleDate = new Date(startDate);
	puzzleDate.setDate(puzzleDate.getDate() + (puzzleId - 1));

	// Format as YYYY-MM-DD
	const dateString = puzzleDate.toISOString().split("T")[0];

	// Get emoji from calendar (cycles after 365)
	const emojiIndex = (puzzleId - 1) % emojiCalendar.length;
	const { emoji, name } = emojiCalendar[emojiIndex];

	return {
		id: puzzleId,
		date: dateString,
		emoji: emoji,
		emojiName: name,
		3: scramblePuzzle(3),
		4: scramblePuzzle(4),
	};
}

/**
 * Upload a single puzzle to Firestore
 */
async function uploadPuzzle(puzzle) {
	const puzzleRef = doc(db, "puzzles", puzzle.id.toString());
	await setDoc(puzzleRef, puzzle);
	console.log(
		`✓ Uploaded puzzle ${puzzle.id} (${puzzle.date}): ${puzzle.emoji} ${puzzle.emojiName}`,
	);
}

/**
 * Upload all 1096 puzzles (3 years: 2026-2028)
 */
async function uploadAllPuzzles() {
	const totalPuzzles = 1096; // 365 + 365 + 366 (2028 is leap year)

	console.log("🚀 Starting puzzle upload...\n");
	console.log(`📅 Generating ${totalPuzzles} puzzles for years 2026-2028`);
	console.log(`   Year 1 (2026): Days 1-365`);
	console.log(`   Year 2 (2027): Days 366-730`);
	console.log(`   Year 3 (2028, leap year): Days 731-1096`);
	console.log(`🎨 Using ${emojiCalendar.length} emojis from calendar\n`);

	try {
		// Sign in anonymously to get through security rules
		console.log("🔐 Signing in anonymously...");
		await signInAnonymously(auth);
		console.log("✅ Signed in successfully\n");

		// Generate and upload puzzles in batches to avoid overwhelming Firestore
		const batchSize = 10;

		for (let i = 1; i <= totalPuzzles; i += batchSize) {
			const batch = [];

			// Generate batch
			for (
				let j = i;
				j < Math.min(i + batchSize, totalPuzzles + 1);
				j++
			) {
				const puzzle = generatePuzzle(j);
				batch.push(uploadPuzzle(puzzle));
			}

			// Upload batch
			await Promise.all(batch);

			// Show progress
			const completed = Math.min(i + batchSize - 1, totalPuzzles);
			console.log(
				`\n📊 Progress: ${completed}/${totalPuzzles} puzzles uploaded\n`,
			);

			// Small delay between batches to be nice to Firestore
			if (i + batchSize <= totalPuzzles) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log(`\n✅ Successfully uploaded all ${totalPuzzles} puzzles!`);
		console.log(
			"\n🎉 Your Slidemoji app is ready for 3 years of daily puzzles!",
		);
		console.log("\nNext steps:");
		console.log(
			"1. Turn off dev mode in .env.local (comment out VITE_DEV_MODE=true)",
		);
		console.log(
			"2. Update Firebase security rules (set allow write: if false)",
		);
		console.log("3. Restart your dev server");
		console.log("4. Sign in and play today's puzzle!\n");
	} catch (error) {
		console.error("\n❌ Error uploading puzzles:", error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the upload
uploadAllPuzzles();
