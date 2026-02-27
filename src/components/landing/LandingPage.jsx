import AnimatedTileGrid from "./AnimatedTileGrid";
import LandingFooter from "./LandingFooter";

function LandingPage({ onPlay }) {
	return (
		<div className="landing-page">
			<div className="landing-content">
				<AnimatedTileGrid />
				<h1 className="landing-title">Slidemoji</h1>
				<p className="landing-subtitle">
					Slide the tiles to rescue the daily emoji
				</p>

				<button className="play-button" onClick={onPlay}>
					<i className="fas fa-play"></i>
					Play
				</button>
			</div>

			<LandingFooter puzzleNumber="001" />
		</div>
	);
}

export default LandingPage;
