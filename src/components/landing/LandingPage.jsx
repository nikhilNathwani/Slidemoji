import AnimatedTileGrid from "./AnimatedTileGrid";
import LandingFooter from "./LandingFooter";

function LandingPage({ onPlay }) {
	return (
		<div className="landing-page">
			<div className="landing-content">
				<AnimatedTileGrid />
				<h1 className="landing-title">Slidemoji</h1>
				<p className="landing-subtitle">
					Slide the tiles to unscramble the daily emoji
				</p>

				<button className="play-button" onClick={onPlay}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 384 512"
						fill="currentColor"
						style={{
							height: "1.1rem",
						}}
					>
						<path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
					</svg>
					Play
				</button>
			</div>

			<LandingFooter puzzleNumber="001" />
		</div>
	);
}

export default LandingPage;
