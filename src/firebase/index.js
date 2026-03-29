// Firebase app and services
export { default as app, db, auth } from "./firebaseConfig";

// Authentication functions
export {
	signInAnonymouslyIfNeeded,
	signInWithGoogle,
	signOut,
	onAuthChange,
	shouldUseRedirectFlow,
} from "./auth";

// Firestore database operations
export {
	getFirestoreUserData,
	syncFirestoreUserData,
	subscribeToFirestoreUserData,
} from "./firestore/user";

export { updateFirestorePreferences } from "./firestore/preference";

export {
	saveFirestoreGameState,
	mergeAnonymousDataToGoogle,
	cleanupAnonymousTrophies,
} from "./firestore/gameState";

export { getFirestorePuzzleById } from "./firestore/puzzle";
