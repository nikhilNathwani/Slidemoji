import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ onClick, isCondensed = false }) {
	const className = isCondensed
		? `${styles.googleSignInButton} ${styles.headerVariant}`
		: styles.googleSignInButton;

	const buttonText = isCondensed ? "Sign in" : "Sign in with Google";

	return (
		<button
			className={className}
			onClick={onClick}
			aria-label="Sign In"
			title="Sign In with Google"
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
