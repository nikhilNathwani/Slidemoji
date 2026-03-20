// Firebase app and services
export { default as app, db, auth } from "./firebaseConfig";

// Authentication functions
export {
	signInWithGoogle,
	signOut,
	onAuthChange,
	getCurrentUser,
} from "./auth";

// Database functions
export {
	getUserData,
	createUserData,
	updateUserPreferences,
	saveGameStart,
	saveGameMove,
	saveGameCompletion,
	cleanupOldGames,
} from "./database";
