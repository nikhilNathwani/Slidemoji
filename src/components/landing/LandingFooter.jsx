import styles from "./LandingFooter.module.css";

function LandingFooter({ puzzleNumber = "001" }) {
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

export default LandingFooter;
