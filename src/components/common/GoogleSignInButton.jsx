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
import { useAuth } from "../../hooks/useAuth";
import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ isCondensed = false }) {
	// Get auth state from context
	const { user, signIn, signOut, loading } = useAuth();
	// Local processing state for better UX (shows loading during click)
	const [isProcessing, setIsProcessing] = useState(false);

	const handleClick = async () => {
		try {
			setIsProcessing(true);
			// Anonymous users should "Sign in" (upgrade to Google)
			// Only Google users should "Sign out"
			if (user?.isAnonymous === false) {
				await signOut(); // Signed in with Google, sign them out
			} else {
				await signIn(); // Anonymous or signed out, sign them in with Google
			}
		} catch (error) {
			console.error("Authentication error:", error);
			// Could show error toast/message here
		} finally {
			setIsProcessing(false);
		}
	};

	const className = isCondensed
		? `${styles.googleSignInButton} ${styles.headerVariant}`
		: styles.googleSignInButton;

	const isDisabled = loading || isProcessing;
	const isSignedInWithGoogle = user?.isAnonymous === false;
	const buttonText = isCondensed
		? isSignedInWithGoogle
			? "Sign out"
			: "Sign in"
		: isSignedInWithGoogle
			? "Sign out"
			: "Sign in with Google";

	// Show loading spinner or button content
	const buttonContent = isProcessing ? (
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
		<button
			className={className}
			onClick={handleClick}
			disabled={isDisabled}
			aria-label={isSignedInWithGoogle ? "Sign Out" : "Sign In"}
			title={isSignedInWithGoogle ? "Sign Out" : "Sign In with Google"}
		>
			{buttonContent}
		</button>
	);
}

export default GoogleSignInButton;
