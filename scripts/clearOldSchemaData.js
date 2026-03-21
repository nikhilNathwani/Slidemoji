/**
 * Script to clear old schema data from Firestore
 * Run this to reset to the new simplified 3x3-only schema
 *
 * Usage:
 *   1. Set your Firebase config below
 *   2. Run: node scripts/clearOldSchemaData.js
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

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_AUTH_DOMAIN",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_STORAGE_BUCKET",
	messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
	appId: "YOUR_APP_ID",
};

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
