import AnimatedTileGrid from "./AnimatedTileGrid";
import styles from "./LandingPage.module.css";
import { getLatestPuzzleId, formatPuzzleId } from "../../utils/puzzleUtils";

function LandingPage({ onPlay }) {
	return (
		<div className={styles.landingPage}>
			<div className={styles.landingContent}>
				<AnimatedTileGrid />
				<h1 className={styles.landingTitle}>Slidem<span className={styles.titleEmoji}>😊</span>ji</h1>
				<p className={styles.landingSubtitle}>
					Slide the tiles to unscramble the daily emoji
				</p>

				<button className={styles.playButton} onClick={onPlay}>
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

			<LandingFooter />
		</div>
	);
}

function LandingFooter() {
	const puzzleId = getLatestPuzzleId();
	const puzzleNumber = formatPuzzleId(puzzleId, { includeHash: false });

	// Get current date formatted as "February 23, 2026"
	const currentDate = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return (
		<footer className={styles.landingFooter}>
			<div className={styles.footerDate}>{currentDate}</div>
			<div className={styles.footerPuzzleNumber}>No. {puzzleNumber}</div>
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
	);
}

export default LandingPage;
