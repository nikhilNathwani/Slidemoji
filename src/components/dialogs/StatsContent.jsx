import Trophy from "../common/Trophy";
import GoogleSignInButton from "../common/GoogleSignInButton";
import styles from "./StatsContent.module.css";

function StatsContent({ dailyEmoji, signedIn, onSignIn }) {
	// Mock data: which puzzle numbers the user has completed
	// In production, this would come from backend
	const earnedPuzzleIds = new Set([1, 3, 5]); // User earned puzzles #1, #3, #5
	const totalPuzzles = signedIn ? 30 : 10; // Show more slots when signed in

	// Generate trophy slots (with gaps for missed puzzles)
	const trophySlots = [];
	for (let i = 1; i <= totalPuzzles; i++) {
		const isEarned = earnedPuzzleIds.has(i);
		trophySlots.push({
			puzzleNum: i,
			isEarned,
			emoji: isEarned ? (i === 1 ? dailyEmoji.emoji : "🎨") : null, // Mock emoji
			name: isEarned
				? i === 1
					? dailyEmoji.name
					: "Daily Puzzle"
				: null,
		});
	}

	return (
		<div className={styles.statsContent}>
			{/* Not signed in: Show sign-in upsell only */}
			{!signedIn ? (
				<div className={styles.statsSignin}>
					<h3 className={styles.statsSigninTitle}>
						Sync Your Progress
					</h3>
					<p className={styles.statsDescription}>
						Sign in to save your trophies and compete on the
						leaderboard!
					</p>
					<GoogleSignInButton onClick={onSignIn} />
					<p className={styles.privacyNote}>
						<i className="fas fa-shield-alt"></i>
						<span>
							We respect your privacy. Your data is never sold or
							shared. We only use your email to save your
							progress.
						</span>
					</p>
				</div>
			) : (
				<>
					{/* Trophy Case (signed-in only) */}
					<div className={styles.trophyCase}>
						<h3>
							<i className="fas fa-trophy"></i> Trophy Case
							<span className={styles.trophyCount}>
								{earnedPuzzleIds.size}/{totalPuzzles}
							</span>
						</h3>
						<div className={styles.emojiGrid}>
							{trophySlots.map((slot) => (
								<Trophy
									key={slot.puzzleNum}
									trophyNum={slot.puzzleNum}
									trophyEmoji={slot.emoji}
									trophyName={slot.name}
									isLocked={!slot.isEarned}
									isEarned={slot.isEarned}
									difficulty={3}
									isMini={true}
								/>
							))}
						</div>
					</div>

					{/* Archive upsell (signed-in only) */}
					<div className={styles.statsDivider}></div>
					<div className={styles.archiveSection}>
						<div className={styles.archiveIcon}>
							<i className="fas fa-archive"></i>
						</div>
						<h3 className={styles.archiveTitle}>
							Missing Some Puzzles?
						</h3>
						<p className={styles.archiveDescription}>
							Unlock the Slidemoji Archive to play past puzzles
							and complete your trophy case!
						</p>
						<button
							className={styles.unlockArchiveButton}
							onClick={() =>
								alert("Archive unlock feature coming soon!")
							}
						>
							<i className="fas fa-unlock"></i>
							Unlock Archive
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default StatsContent;
