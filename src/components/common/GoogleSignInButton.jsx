import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ isCondensed = false }) {
	const { user, signIn, signOut, loading } = useAuth();
	const [isProcessing, setIsProcessing] = useState(false);

	const handleClick = async () => {
		try {
			setIsProcessing(true);
			if (user) {
				await signOut();
			} else {
				await signIn();
			}
		} catch (error) {
			console.error("Authentication error:", error);
			// You could show an error message to the user here
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
