/**
 * Storage - unified storage entry point
 *
 * This is the single entry point for all storage operations.
 * Re-exports all public APIs from storage modules.
 *
 * Note: Most storage logic now handled by React Query + Firestore offline persistence.
 * This file primarily exports functions needed for:
 * - Initial user setup (getUserDataFromFirestore, createUserDataInFirestore)
 * - Migration (migrateLocalStorageToFirestore)
 * - Cleanup (cleanupOldPuzzleData)
 * - Direct Firestore saves for specific use cases (saveGameStateToFirestore)
 */

// Re-export Firestore operations
export {
	getUserDataFromFirestore,
	createUserDataInFirestore,
	updateUserPreferencesToFirestore,
	saveGameStateToFirestore,
} from "./firestore";

// Re-export anonymous storage operations
export { cleanupOldPuzzleData } from "./anonymous";

// Re-export migration
export { migrateLocalStorageToFirestore } from "./migration";
