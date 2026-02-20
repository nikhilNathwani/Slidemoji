import AnimatedTileGrid from "./AnimatedTileGrid";

function LandingPage({ onPlay }) {
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
			</div>

			<footer className="landing-footer">
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
