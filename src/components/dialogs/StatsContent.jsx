import Trophy from "../common/Trophy";
import GoogleSignInButton from "../common/GoogleSignInButton";

function StatsContent({ earnedEmojis, dailyEmoji }) {
	return (
		<div className="stats-content">
			<div className="trophy-case">
				<h3 className="trophy-case-title">
					<i className="fas fa-trophy"></i> Trophy Case
				</h3>
				<div className="emoji-grid">
					{earnedEmojis.map((emoji, index) => (
						<Trophy
							key={index}
							trophyNum={1}
							trophyEmoji={emoji}
							trophyName={dailyEmoji.name}
							isMini={true}
						/>
					))}
				</div>
			</div>
			<div className="stats-divider"></div>
			<div className="stats-signin">
				<h3 className="stats-signin-title">Sync Your Progress</h3>
				<p className="stats-description">
					Sign in to save your trophies and compete on the
					leaderboard!
				</p>
				<GoogleSignInButton
					onSignIn={() => alert("Sign in coming soon!")}
				/>
				<p className="privacy-note">
					<i className="fas fa-shield-alt"></i>
					<span>
						We respect your privacy. Your data is never sold or
						shared. We only use your email to save your progress.
					</span>
				</p>
			</div>
		</div>
	);
}

export default StatsContent;
