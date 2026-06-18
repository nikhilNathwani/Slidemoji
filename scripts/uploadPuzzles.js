/**
 * Script to upload 1337 puzzles to Firestore
 *
 * Run with: node scripts/uploadPuzzles.js
 * (Make sure you have .env.local with Firebase credentials)
 *
 * This creates one puzzle for each day from 2026-2028 (3 years including leap year),
 * using the emoji calendar and generating scrambled grids for both 3x3 and 4x4 difficulties.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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
		envVars[key.trim()] = valueParts.join("=").trim().replace(/^"|"$/g, "");
	}
});

console.log("Loaded environment variables:", Object.keys(envVars));

// Admin SDK credentials — bypasses Firestore security rules
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

console.log("Firebase config loaded successfully ✓\n");

// Initialize Admin SDK
const app = initializeApp({
	credential: cert({
		projectId: envVars.FIREBASE_PROJECT_ID,
		clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
		privateKey,
	}),
});
const db = getFirestore(app);

/**
 * Scramble puzzle grid - creates a solvable random configuration
 * Ensures the gap always ends up in the bottom-right corner
 * Grid uses 1-8 for tiles and 0 for gap (app + Firestore format)
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
	// Get emoji from calendar (cycles after 365)
	const emojiIndex = (puzzleId - 1) % emojiCalendar.length;
	const { emoji, name, category, subcategory } = emojiCalendar[emojiIndex];

	return {
		id: puzzleId,
		emoji: emoji,
		emojiName: name,
		category: category,
		subcategory: subcategory,
		normal: scramblePuzzle(3),
		hard: scramblePuzzle(4),
	};
}

/**
 * Upload a single puzzle to Firestore
 */
async function uploadPuzzle(puzzle) {
	const puzzleRef = db.collection("puzzles2").doc(puzzle.id.toString());
	await puzzleRef.set(puzzle);
	console.log(
		`✓ Uploaded puzzle ${puzzle.id}: ${puzzle.emoji} ${puzzle.emojiName}`,
	);
}

/**
 * Upload all 1337 puzzles (4 years: 2026-2029))
 */
async function uploadAllPuzzles() {
	const totalPuzzles = 1337; // 365 + 365 + 366 + 241 (2029 is partial year)

	console.log("🚀 Starting puzzle upload...\n");
	console.log(`📅 Generating ${totalPuzzles} puzzles for years 2026-2029`);
	console.log(`   Year 1 (2026): Days 1-365`);
	console.log(`   Year 2 (2027): Days 366-730`);
	console.log(`   Year 3 (2028, leap year): Days 731-1096`);
	console.log(`   Year 4 (2029, partial year): Days 1097-1337`);
	console.log(`🎨 Using ${emojiCalendar.length} emojis from calendar\n`);

	try {
		console.log("✅ Using Admin SDK — security rules bypassed\n");

		// Generate and upload puzzles in batches to avoid overwhelming Firestore
		const batchSize = 10;

		for (let i = 48; i <= totalPuzzles; i += batchSize) {
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
// uploadAllPuzzles();

// Copy puzzle documents 1 through 47 from puzzles collection into puzzles2 collection
function copyPuzzleDocsFromPuzzlesToPuzzles2(startId = 1, endId = 47) {
	const puzzlesRef = db.collection("puzzles");
	const puzzles2Ref = db.collection("puzzles2");

	puzzlesRef
		.where("id", ">=", startId)
		.where("id", "<=", endId)
		.get()
		.then((snapshot) => {
			const batch = db.batch();
			snapshot.forEach((doc) => {
				const data = doc.data();
				const newDocRef = puzzles2Ref.doc(doc.id);
				batch.set(newDocRef, data);
				console.log(`Prepared copy of puzzle ${data.id} to puzzles2`);
			});
			return batch.commit();
		})
		.then(() => {
			console.log(
				`✅ Successfully copied puzzles ${startId}-${endId} to puzzles2!`,
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error copying puzzles:", error);
			process.exit(1);
		});
}

// Run the copy
// copyPuzzleDocsFromPuzzlesToPuzzles2(1, 47);

// Count unique puzzle docs IDs and min/max puzzle doc IDs in puzzles2 collection
function countUniquePuzzleIDsInPuzzles2() {
	const puzzles2Ref = db.collection("puzzles2");
	puzzles2Ref
		.get()
		.then((snapshot) => {
			const ids = new Set();
			let minId = Infinity;
			let maxId = -Infinity;

			snapshot.forEach((doc) => {
				const data = doc.data();
				if (data.id !== undefined) {
					ids.add(data.id);
					if (data.id < minId) minId = data.id;
					if (data.id > maxId) maxId = data.id;
				}
			});

			console.log(`✅ Unique puzzle IDs in puzzles2: ${ids.size}`);
			console.log(`📉 Min puzzle ID: ${minId}`);
			console.log(`📈 Max puzzle ID: ${maxId}`);
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error counting puzzle IDs:", error);
			process.exit(1);
		});
}

function addCategoryAndSubcategoryToPuzzles2LegacyDocs(
	startId = 1,
	endId = 47,
) {
	const puzzles2Ref = db.collection("puzzles2");

	puzzles2Ref
		.where("id", ">=", startId)
		.where("id", "<=", endId)
		.get()
		.then((snapshot) => {
			const batch = db.batch();
			snapshot.forEach((doc) => {
				const data = doc.data();
				const emojiInfo = emojiCalendar.find(
					(item) => item.emoji === data.emoji,
				);
				if (emojiInfo) {
					const newData = {
						...data,
						category: emojiInfo.category,
						subcategory: emojiInfo.subcategory,
					};
					batch.set(doc.ref, newData);
					console.log(
						`Prepared update of puzzle ${data.id} with category and subcategory`,
					);
				} else {
					console.warn(
						`⚠️ Emoji ${data.emoji} not found in calendar for puzzle ${data.id}`,
					);
				}
			});
			return batch.commit();
		})
		.then(() => {
			console.log(
				`✅ Successfully updated puzzles ${startId}-${endId} with category and subcategory!`,
			);
			//print puzzle docs 1 through 47 to verify
			return puzzles2Ref
				.where("id", ">=", startId)
				.where("id", "<=", endId)
				.get();
		})
		.then((snapshot) => {
			console.log(`\n📄 Updated puzzle documents in puzzles2:`);
			snapshot.forEach((doc) => {
				console.log(doc.data());
			});
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error updating puzzles:", error);
			process.exit(1);
		});
}

function confirmNormalAndHardAreEqualInPuzzlesAndPuzzles2LegacyDocs(
	startId = 1,
	endId = 47,
) {
	const puzzlesRef = db.collection("puzzles");
	const puzzles2Ref = db.collection("puzzles2");

	Promise.all([
		puzzlesRef.where("id", ">=", startId).where("id", "<=", endId).get(),
		puzzles2Ref.where("id", ">=", startId).where("id", "<=", endId).get(),
	])
		.then(([snapshot1, snapshot2]) => {
			const puzzlesMap = new Map();
			snapshot1.forEach((doc) => {
				const data = doc.data();
				puzzlesMap.set(data.id, data);
			});

			let allMatch = true;
			snapshot2.forEach((doc) => {
				const data = doc.data();
				const originalData = puzzlesMap.get(data.id);
				if (
					JSON.stringify(data.normal) !==
						JSON.stringify(originalData.normal) ||
					JSON.stringify(data.hard) !==
						JSON.stringify(originalData.hard)
				) {
					console.error(
						`❌ Mismatch in normal or hard grid for puzzle ID ${data.id}`,
					);
					allMatch = false;
				} else {
					console.log(
						`✓ Puzzle ID ${data.id} has matching normal and hard grids`,
					);
				}
			});

			if (allMatch) {
				console.log(
					"\n✅ All puzzles have matching normal and hard grids in puzzles and puzzles2!",
				);
			} else {
				console.warn(
					"\n⚠️ Some puzzles have mismatches in normal or hard grids between puzzles and puzzles2. Check logs above for details.",
				);
			}
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error comparing puzzles:", error);
			process.exit(1);
		});
}

function getWikiCorpusVersionOfEmoji(emoji) {
	const wikiCorpus = readFileSync(
		join(__dirname, "../data/corpus/source/wikipedia_corpus.csv"),
		"utf-8",
	)
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line);

	for (const row of wikiCorpus) {
		const wikiEmoji = row.split(",")[0].trim();
		if (wikiEmoji.replace(/\ufe0f/g, "") === emoji.replace(/\ufe0f/g, "")) {
			return wikiEmoji;
		}
	}
	console.log(`⚠️ Emoji ${emoji} not found in wiki corpus`);
	return null; // Not found in wiki corpus
}

function useWikiCorpusVersionsOfEmojisForAll1337PuzzlesInPuzzles2() {
	//wiki corpus is in ../data/corpus/source/wikipedia_corpus.csv, each row is just the emoji in column 0

	const puzzles2Ref = db.collection("puzzles2");
	puzzles2Ref
		.get()
		.then((snapshot) => {
			const batch = db.batch();
			snapshot.forEach((doc) => {
				const data = doc.data();
				const wikiEmoji = getWikiCorpusVersionOfEmoji(data.emoji);
				if (wikiEmoji && wikiEmoji !== data.emoji) {
					const newData = {
						...data,
						emoji: wikiEmoji,
					};
					batch.set(doc.ref, newData);
					console.log(
						`Prepared update of puzzle ${data.id} with wiki corpus version of emoji`,
					);
				}
			});
			return batch.commit();
		})
		.then(() => {
			console.log(
				`✅ Successfully updated all puzzles in puzzles2 with wiki corpus versions of emojis!`,
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error(
				"\n❌ Error updating puzzles with wiki corpus emojis:",
				error,
			);
			process.exit(1);
		});
}

function renamePuzzlesToPuzzles_OLD() {
	const puzzlesRef = db.collection("puzzles");
	const puzzlesOldRef = db.collection("puzzles_old");

	puzzlesRef
		.get()
		.then((snapshot) => {
			const batch = db.batch();
			snapshot.forEach((doc) => {
				const data = doc.data();
				const newDocRef = puzzlesOldRef.doc(doc.id);
				batch.set(newDocRef, data);
				console.log(
					`Prepared copy of puzzle ${data.id} to puzzles_old`,
				);
			});
			return batch.commit();
		})
		.then(() => {
			console.log(
				`✅ Successfully renamed puzzles collection to puzzles_old!`,
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error renaming puzzles collection:", error);
			process.exit(1);
		});
}

function renamePuzzles2ToPuzzles() {
	const puzzles2Ref = db.collection("puzzles2");
	const puzzlesRef = db.collection("puzzles");

	puzzles2Ref
		.get()
		.then((snapshot) => {
			const batch = db.batch();
			snapshot.forEach((doc) => {
				const data = doc.data();
				const newDocRef = puzzlesRef.doc(doc.id);
				batch.set(newDocRef, data);
				console.log(
					`Prepared copy of puzzle ${data.id} from puzzles2 to puzzles`,
				);
			});
			return batch.commit();
		})
		.then(() => {
			console.log(
				`✅ Successfully renamed puzzles2 collection to puzzles!`,
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Error renaming puzzles2 collection:", error);
			process.exit(1);
		});
}

// Run the count
// addCategoryAndSubcategoryToPuzzles2LegacyDocs();
renamePuzzles2ToPuzzles();
