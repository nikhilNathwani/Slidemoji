import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import { useAuth } from "../auth/useAuth";
import {
	FontAwesomeIcon,
	faClockRotateLeft,
	faTrophy,
	faCog,
	faUserCircle,
	faSignOutAlt,
} from "../utils/icons";

// Deterministic color from a string — consistent across renders for the same user
const AVATAR_COLORS = [
	"#4285F4",
	"#DB4437",
	"#F4B400",
	"#0F9D58",
	"#AB47BC",
	"#00ACC1",
	"#FF7043",
	"#9E9D24",
];
function getAvatarColor(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++)
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
				{user && !user.isAnonymous && (
					<button
						className={`btn-icon ${styles.headerButton}`}
						onClick={onArchiveClick}
						aria-label="Puzzle Archive"
						title="Puzzle Archive"
					>
						<FontAwesomeIcon icon={faClockRotateLeft} />
					</button>
				)}
				<button
					className={`btn-icon ${styles.headerButton}`}
					onClick={onStatsClick}
					aria-label="Stats"
					title="Stats"
				>
					<FontAwesomeIcon icon={faTrophy} />
				</button>
				<button
					className={`btn-icon ${styles.headerButton}`}
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
							) : user.displayName ? (
								<div
									className={styles.avatarInitial}
									style={{
										backgroundColor: getAvatarColor(
											user.displayName,
										),
									}}
									aria-hidden="true"
								>
									{user.displayName[0].toUpperCase()}
								</div>
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
								<div className={styles.accountMenuDivider} />
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
