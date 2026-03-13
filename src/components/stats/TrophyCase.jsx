import { FontAwesomeIcon } from "../../utils/icons";
import Trophy from "../common/Trophy";
import styles from "./TrophyCase.module.css";
import { useState, useEffect } from "react";

function TrophyCase({ totalPuzzles = 12, solvedPuzzles, showTitle = true }) {
	const TROPHIES_PER_PAGE = 12;
	const totalPages = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	// Calculate initial page based on today's puzzle
	const initialPage = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(initialPage);

	// Update current page when totalPuzzles changes
	useEffect(() => {
		const newPage = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
		setCurrentPage(newPage);
	}, [totalPuzzles]);

	// Calculate range for current page
	const startIndex = (currentPage - 1) * TROPHIES_PER_PAGE + 1;
	const endIndex = Math.min(currentPage * TROPHIES_PER_PAGE, totalPuzzles);

	// Generate trophy slots for current page only
	const trophySlots = [];
	for (let i = startIndex; i <= endIndex; i++) {
		// Check if puzzle is earned
		const isEarned = solvedPuzzles?.[i];
		// Get actual emoji from solvedPuzzles if available
		let emoji = null;
		let name = null;
		let maxDifficulty = 0;
		if (isEarned) {
			// Get emoji from first solved difficulty for this puzzle
			const difficulties = Object.keys(solvedPuzzles[i]);
			if (difficulties.length > 0) {
				const puzzleData = solvedPuzzles[i][difficulties[0]];
				emoji = puzzleData?.emoji || null;
				name = puzzleData?.emojiName || null;
				maxDifficulty = Math.max(...difficulties.map(Number));
			}
		}

		trophySlots.push({
			puzzleNum: i,
			isEarned,
			emoji,
			name,
			maxDifficulty: maxDifficulty,
		});
	}

	const handlePrevPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	return (
		<div className={styles.trophyCase}>
			{showTitle && (
				<h3>
					<FontAwesomeIcon icon="trophy" /> Trophy Case
					<span className={styles.trophyCount}>
						{numEarnedTrophies}/{totalPuzzles}
					</span>
				</h3>
			)}

			<div className={styles.emojiGrid}>
				{trophySlots.map((slot) => (
					<Trophy
						key={slot.puzzleNum}
						trophyNum={slot.puzzleNum}
						trophyEmoji={slot.emoji}
						trophyName={slot.name}
						isLocked={!slot.isEarned}
						maxCompletedDifficulty={slot.maxDifficulty}
						isMini={true}
					/>
				))}
			</div>

			{totalPages > 1 && (
				<div className={styles.pagination}>
					<button
						className={styles.paginationButton}
						onClick={handlePrevPage}
						disabled={currentPage === 1}
						aria-label="Previous page"
					>
						<FontAwesomeIcon icon="chevron-left" />
					</button>
					<span className={styles.pageInfo}>
						Page {currentPage} of {totalPages}
					</span>
					<button
						className={styles.paginationButton}
						onClick={handleNextPage}
						disabled={currentPage === totalPages}
						aria-label="Next page"
					>
						<FontAwesomeIcon icon="chevron-right" />
					</button>
				</div>
			)}
		</div>
	);
}

export default TrophyCase;
