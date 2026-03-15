// Firebase app and services
export { default as app, db, auth } from "./config";

// Authentication functions
export {
	signInWithGoogle,
	signOut,
	onAuthChange,
	getCurrentUser,
} from "./auth";

// Firestore functions
export {
	getUserData,
	createUserData,
	updateUserPreferences,
	savePuzzleStart,
	saveGameState,
	saveCompletion,
	cleanupOldGames,
} from "./firestore";
