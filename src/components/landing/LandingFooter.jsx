function LandingFooter({ puzzleNumber = "001" }) {
	// Get current date formatted as "February 23, 2026"
	const currentDate = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return (
		<footer className="landing-footer">
			<div className="footer-date">{currentDate}</div>
			<div className="footer-puzzle-number">No. {puzzleNumber}</div>
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
