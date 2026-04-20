import { useEffect } from "react";
import AnimatedTileGrid from "./AnimatedTileGrid";
import styles from "./LandingPage.module.css";
import { getLatestPuzzleId, formatPuzzleId } from "../../utils/puzzleUtils";

function LandingPage({ onPlay }) {
	useEffect(() => {
		// Landing page is always light — override any saved dark preference on <html>.
		// The game's useTheme hook will re-apply the user's actual preference when it mounts.
		const root = document.documentElement;
		root.classList.remove("dark-theme");
		root.classList.add("light-theme");
		root.style.colorScheme = "light";
		root.style.background = "#ffffff";
		document.body.style.background = "#ffffff";
		document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
		const meta = document.createElement("meta");
		meta.name = "theme-color";
		meta.content = "#ffffff";
		document.head.appendChild(meta);
	}, []);

	return (
		<div className={`${styles.landingPage} light-theme`}>
			<div className={styles.landingContent}>
				<AnimatedTileGrid />
				<h1 className={styles.landingTitle}>
					Slidem<span className={styles.titleEmoji}>😊</span>ji
				</h1>
				<p className={styles.landingSubtitle}>
					Unscramble the daily emoji
				</p>

				<button
					className={`btn btn-solid ${styles.playButton}`}
					onClick={onPlay}
				>
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
