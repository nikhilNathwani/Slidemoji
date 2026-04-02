import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import GoogleSignInButton from "./common/GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import { FontAwesomeIcon } from "../utils/icons";

const ARCHIVE_SEEN_KEY = "slidemoji_archive_seen";

function Header({ onSettingsClick, onStatsClick, onArchiveClick }) {
	const { user, signOut } = useAuth();
	const { isPremium } = useSubscription();
	const [showAccountMenu, setShowAccountMenu] = useState(false);
	const [showArchiveBadge, setShowArchiveBadge] = useState(
		() => isPremium && !localStorage.getItem(ARCHIVE_SEEN_KEY),
	);
	const menuRef = useRef(null);

	// Show "New" badge when the user first becomes premium
	useEffect(() => {
		if (isPremium && !localStorage.getItem(ARCHIVE_SEEN_KEY)) {
			setShowArchiveBadge(true);
		}
	}, [isPremium]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowAccountMenu(false);
			}
		};

		if (showAccountMenu) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showAccountMenu]);

	const handleSignOut = async () => {
		setShowAccountMenu(false);
		await signOut();
	};

	return (
		<header className={styles.appHeader}>
			<h1 className={styles.appTitle}>Slidemoji</h1>
			<div className={styles.headerActions}>
				{isPremium && (
					<div className={styles.archiveButtonWrapper}>
						<button
							className={styles.iconButton}
							onClick={() => {
								localStorage.setItem(ARCHIVE_SEEN_KEY, "1");
								setShowArchiveBadge(false);
								onArchiveClick();
							}}
							aria-label="Archive"
							title="Puzzle Archive"
						>
							<FontAwesomeIcon icon="clock-rotate-left" />
						</button>
						{showArchiveBadge && (
							<span
								className={styles.newBadge}
								aria-hidden="true"
							>
								New
							</span>
						)}
					</div>
				)}
				<button
					className={styles.iconButton}
					onClick={onStatsClick}
					aria-label="Stats"
					title="Stats"
				>
					<FontAwesomeIcon icon="trophy" />
				</button>
				<button
					className={styles.iconButton}
					onClick={onSettingsClick}
					aria-label="Settings"
					title="Settings"
				>
					<FontAwesomeIcon icon="cog" />
				</button>
				{user?.isAnonymous === false ? (
					<div className={styles.accountContainer} ref={menuRef}>
						<button
							className={styles.avatarButton}
							onClick={() => setShowAccountMenu(!showAccountMenu)}
							aria-label="Account"
							title={user.displayName || user.email}
						>
							{user.photoURL ? (
								<img
									src={user.photoURL}
									alt={user.displayName || "User"}
									className={styles.avatarImage}
									referrerPolicy="no-referrer"
								/>
							) : (
								<FontAwesomeIcon icon="user-circle" />
							)}
						</button>
						{showAccountMenu && (
							<div className={styles.accountMenu}>
								<div className={styles.accountMenuHeader}>
									<div className={styles.accountInfo}>
										{user.displayName && (
											<div className={styles.accountName}>
												{user.displayName}
											</div>
										)}
										<div className={styles.accountEmail}>
											{user.email}
										</div>
									</div>
								</div>
								<div
									className={styles.accountMenuDivider}
								></div>
								<button
									className={styles.accountMenuItem}
									onClick={handleSignOut}
								>
									<FontAwesomeIcon icon="sign-out-alt" />
									Sign out
								</button>
							</div>
						)}
					</div>
				) : (
					<GoogleSignInButton isCondensed={true} />
				)}
			</div>
		</header>
	);
}

export default Header;
