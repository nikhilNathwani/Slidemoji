import styles from "./GoogleSignInButton.module.css";

function GoogleSignInButton({ onClick, isHeader }) {
	const className = isHeader
		? `${styles.googleSignInButton} ${styles.headerVariant}`
		: styles.googleSignInButton;

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
			Sign in
		</button>
	);
}

export default GoogleSignInButton;
