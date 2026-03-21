/**
 * Script to clear old schema data from Firestore
 * Run this to reset to the new simplified 3x3-only schema
 *
 * Usage:
 *   1. Make sure .env.local has your Firebase config
 *   2. Run: node --env-file=.env.local scripts/clearOldSchemaData.js
 *
 * This will clear all gameState and solvedPuzzles data from Firestore.
 * Users will start fresh with the new schema.
 *
 * ALTERNATIVE: Clear data manually in Firebase Console:
 *   1. Go to Firestore Database
 *   2. For each user document, delete gameState and stats.solvedPuzzles fields
 *   3. Or delete entire user documents to completely reset
 *
 * For localStorage: Add to browser console: localStorage.clear()
 */

import { initializeApp } from "firebase/app";
import {
	getFirestore,
	collection,
	getDocs,
	doc,
	updateDoc,
} from "firebase/firestore";

// Load Firebase config from environment variables
const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate config
if (!firebaseConfig.apiKey) {
	throw new Error(
		"Missing Firebase config. Run with: node --env-file=.env.local scripts/clearOldSchemaData.js",
	);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearOldSchemaData() {
	console.log("🔍 Finding users with old schema data...\n");

	const usersRef = collection(db, "users");
	const snapshot = await getDocs(usersRef);

	let updatedCount = 0;

	for (const userDoc of snapshot.docs) {
		const userId = userDoc.id;

		console.log(`Checking user: ${userId}`);

		// Clear gameState and solvedPuzzles
		await updateDoc(doc(db, "users", userId), {
			gameState: {},
			"stats.solvedPuzzles": {},
		});

		updatedCount++;
		console.log(`  ✓ Cleared gameState and solvedPuzzles\n`);
	}

	console.log(`\n✅ Complete! Updated ${updatedCount} users.`);
	console.log(
		"\nNote: Users will need to clear their localStorage manually or refresh.",
	);
	console.log(
		"Add this to browser console to clear localStorage: localStorage.clear()",
	);
}

// Run the script (Note: This is a manual script - update Firebase config first!)
clearOldSchemaData()
	.then(() => {
		console.log("✅ Complete! Exiting...");
	})
	.catch((error) => {
		console.error("❌ Error:", error);
	});
