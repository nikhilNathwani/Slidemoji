import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ onSignIn, variant }) {
	const className =
		variant === "header"
			? `${styles.googleSignInButton} ${styles.headerVariant}`
			: styles.googleSignInButton;

	return (
		<button
			className={className}
			onClick={onSignIn}
			aria-label="Sign In"
			title="Sign In with Google"
		>
			<img
				src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
				alt="Google"
				className={styles.googleIcon}
			/>
			Sign in
		</button>
	);
}

export default GoogleSignInButton;
