import AnimatedTileGrid from "./AnimatedTileGrid";

function LandingPage({ onPlay }) {
	// Get current date formatted as "February 20, 2026"
	const currentDate = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return (
		<div className="landing-page">
			<div className="landing-content">
				<AnimatedTileGrid />
				<h1 className="landing-title">Slidemoji</h1>
				<p className="landing-subtitle">
					Slide the tiles to reveal the daily emoji
				</p>

				<button className="play-button" onClick={onPlay}>
					<i className="fas fa-play"></i>
					Play
				</button>

				<button
					className="google-signin-btn landing-signin"
					onClick={() => alert("Sign in coming soon!")}
				>
					<img
						src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
						alt="Google"
						className="google-icon"
					/>
					Sign in with Google
				</button>
			</div>

			<footer className="landing-footer">
				<div className="footer-date">{currentDate}</div>
				<div className="footer-puzzle-number">No. 001</div>
				<p>
					Made by{" "}
					<a
						href="https://nikhilnathwani.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						Nikhil Nathwani
					</a>
				</p>
			</footer>
		</div>
	);
}

export default LandingPage;
