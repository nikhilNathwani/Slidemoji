/**
 * GoogleSignInButton - Handles Google authentication
 *
 * Shows sign-in or sign-out button based on auth state.
 * Displays user's profile picture in header when signed in.
 *
 * Props:
 * - isCondensed: If true, shows compact version for header
 *
 * States:
 * - isProcessing: Local loading state for click feedback
 * - Disabled during loading or processing to prevent double-clicks
 */

import { useState } from "react";
import { useAuth } from "./useAuth";
import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ isCondensed = false }) {
	const { user, signIn, signOut, isLoading } = useAuth();
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null);

	const handleClick = async () => {
		try {
			setIsProcessing(true);
			setErrorMessage(null);
			if (user?.isAnonymous === false) {
				await signOut();
			} else {
				await signIn();
			}
		} catch (error) {
			if (error.code === "auth/popup-blocked") {
				setErrorMessage(
					"Popup blocked — please allow popups for this site and try again.",
				);
			} else {
				setErrorMessage("Sign-in failed. Please try again.");
				console.error("Authentication error:", error);
			}
		} finally {
			setIsProcessing(false);
		}
	};

	const className = isCondensed
		? `btn btn-google ${styles.headerVariant}`
		: `btn btn-google`;

	const isDisabled = isLoading || isProcessing;
	const isSignedInWithGoogle = user?.isAnonymous === false;
	const buttonText = isCondensed
		? isSignedInWithGoogle
			? "Sign out"
			: "Sign in"
		: isSignedInWithGoogle
			? "Sign out"
			: "Sign in with Google";

	// Show loading when any auth operation is in-flight (covers both this button's
	// local click and global auth transitions), so all visible sign-in buttons
	// show "Loading…" simultaneously.
	const isShowingLoading = isLoading || isProcessing;
	const buttonContent = isShowingLoading ? (
		<span>Loading...</span>
	) : (
		<>
			<img
				src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
				alt="Google"
				className={styles.googleIcon}
			/>
			{buttonText}
		</>
	);

	return (
		<>
			<button
				className={className}
				onClick={handleClick}
				disabled={isDisabled}
				aria-label={isSignedInWithGoogle ? "Sign Out" : "Sign In"}
				title={
					isSignedInWithGoogle ? "Sign Out" : "Sign In with Google"
				}
			>
				{buttonContent}
			</button>
			{errorMessage && (
				<p className={styles.errorMessage} role="alert">
					{errorMessage}
				</p>
			)}
		</>
	);
}

export default GoogleSignInButton;
