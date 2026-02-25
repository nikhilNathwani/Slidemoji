import styles from "./Header.module.css";
import GoogleSignInButton from "./common/GoogleSignInButton";

function Header({ onSettingsClick, onStatsClick, onSignIn, signedIn }) {
	return (
		<header className={styles.appHeader}>
			<h1 className={styles.appTitle}>Slidemoji</h1>
			<div className={styles.headerActions}>
				<button
					className={styles.iconButton}
					onClick={onSettingsClick}
					aria-label="Settings"
					title="Settings"
				>
					<i className="fas fa-cog"></i>
				</button>
				<button
					className={styles.iconButton}
					onClick={onStatsClick}
					aria-label="Stats"
					title="Stats"
				>
					<i className="fas fa-trophy"></i>
				</button>
				{signedIn ? (
					<button
						className={styles.avatarButton}
						aria-label="Account"
						title="Account"
					>
						<i className="fas fa-user-circle"></i>
					</button>
				) : (
					<GoogleSignInButton onClick={onSignIn} isHeader={true} />
				)}
			</div>
		</header>
	);
}

export default Header;
