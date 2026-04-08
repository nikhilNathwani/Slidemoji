import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import GoogleSignInButton from "./common/GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";
import {
	FontAwesomeIcon,
	faClockRotateLeft,
	faTrophy,
	faCog,
	faUserCircle,
	faSignOutAlt,
} from "../utils/icons";

function Header({ onSettingsClick, onStatsClick, onArchiveClick }) {
	const { user, signOut } = useAuth();
	const [showAccountMenu, setShowAccountMenu] = useState(false);
	const menuRef = useRef(null);

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
				<button
					className={styles.iconButton}
					onClick={onArchiveClick}
					aria-label="Puzzle Archive"
					title="Puzzle Archive"
				>
					<FontAwesomeIcon icon={faClockRotateLeft} />
				</button>
				<button
					className={styles.iconButton}
					onClick={onStatsClick}
					aria-label="Stats"
					title="Stats"
				>
					<FontAwesomeIcon icon={faTrophy} />
				</button>
				<button
					className={styles.iconButton}
					onClick={onSettingsClick}
					aria-label="Settings"
					title="Settings"
				>
					<FontAwesomeIcon icon={faCog} />
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
								<FontAwesomeIcon icon={faUserCircle} />
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
									<FontAwesomeIcon icon={faSignOutAlt} />
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
