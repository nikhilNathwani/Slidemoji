// Firebase app and services
export { default as app, db, auth } from "./firebaseConfig";

// Authentication functions
export {
	signInWithGoogle,
	signOut,
	onAuthChange,
	getCurrentUser,
} from "./auth";
