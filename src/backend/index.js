// Firebase app and services
export { default as app, db, auth } from "./firebaseConfig";

// Authentication functions
export {
	signInAnonymouslyIfNeeded,
	signInWithGoogle,
	signOut,
	onAuthChange,
	getCurrentUser,
	isSignedIn,
} from "./auth";

// Firestore database operations
export {
	getFirestoreUserData,
	createFirestoreUserData,
	updateFirestoreUserProfile,
	updateFirestorePreferences,
	saveFirestoreGameState,
	mergeAnonymousDataToGoogle,
	cleanupAnonymousTrophies,
} from "./firestore";
