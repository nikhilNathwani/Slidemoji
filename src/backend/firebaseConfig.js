import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
	console.error("[FIREBASE] Missing required environment variables:", {
		hasApiKey: !!firebaseConfig.apiKey,
		hasProjectId: !!firebaseConfig.projectId,
		hasAuthDomain: !!firebaseConfig.authDomain,
	});
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
// This enables automatic offline caching and sync for signed-in users
export const db = initializeFirestore(app, {
	localCache: persistentLocalCache(),
});
export const auth = getAuth(app);

export default app;
