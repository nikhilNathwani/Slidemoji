// Firebase app and services
export { default as app, db, auth } from "./firebaseConfig";

// Authentication functions
export {
	signInAnonymously,
	signInWithGoogle,
	signOut,
	onAuthChange,
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
	trimGameHistory,
} from "./firestore/gameState";

export { getFirestorePuzzleById } from "./firestore/puzzle";
