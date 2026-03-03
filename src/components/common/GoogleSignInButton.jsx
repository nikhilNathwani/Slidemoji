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
			if (user) {
				await signOut(); // User is signed in, sign them out
			} else {
				await signIn(); // User is signed out, sign them in
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
	const buttonText = isCondensed
		? user
			? "Sign out"
			: "Sign in"
		: user
			? "Sign out"
			: "Sign in with Google";

	return (
		<button
			className={className}
			onClick={handleClick}
			disabled={isDisabled}
			aria-label={user ? "Sign Out" : "Sign In"}
			title={user ? "Sign Out" : "Sign In with Google"}
			style={{ opacity: isDisabled ? 0.6 : 1 }}
		>
			<img
				src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
				alt="Google"
				className={styles.googleIcon}
			/>
			{buttonText}
		</button>
	);
}

export default GoogleSignInButton;
