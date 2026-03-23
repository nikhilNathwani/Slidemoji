import { FontAwesomeIcon } from "../../utils/icons";
import Trophy from "../common/Trophy";
import styles from "./TrophyCase.module.css";
import { useState } from "react";

function TrophyCase({
	totalPuzzles = 12,
	solvedPuzzles,
	showTitle = true,
	puzzleId,
}) {
	const TROPHIES_PER_PAGE = 12;
	const totalPages = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	// Calculate initial page based on today's puzzle
	const initialPage = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(initialPage);

	// Calculate range for current page
	const startIndex = (currentPage - 1) * TROPHIES_PER_PAGE + 1;

	// Generate trophy slots for current page - always show 12 slots
	const trophySlots = [];
	for (let i = 0; i < TROPHIES_PER_PAGE; i++) {
		const puzzleNum = startIndex + i;
		const isPlaceholder = puzzleNum > totalPuzzles;

		if (isPlaceholder) {
			// Add invisible placeholder to maintain grid layout
			trophySlots.push({
				puzzleNum: `placeholder-${i}`,
				isPlaceholder: true,
				isEarned: false,
				emoji: null,
				name: null,
				maxDifficulty: 0,
			});
		} else {
			// Check if puzzle is earned (simplified schema: solvedPuzzles[id] = true)
			const isEarned = !!solvedPuzzles?.[puzzleNum];

			trophySlots.push({
				puzzleNum,
				isPlaceholder: false,
				isEarned,
				isToday: puzzleNum === puzzleId,
				// Emoji/name will be fetched by Trophy component via usePuzzle
				emoji: null,
				name: null,
				maxDifficulty: 0, // No longer used (3x3 only)
			});
		}
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
				{trophySlots.map((slot) => {
					return (
						<div
							key={slot.puzzleNum}
							style={{
								visibility: slot.isPlaceholder
									? "hidden"
									: "visible",
							}}
						>
							<Trophy
								trophyNum={slot.puzzleNum}
								trophyEmoji={slot.emoji}
								trophyName={slot.name}
								isLocked={!slot.isEarned}
								isToday={slot.isToday && !slot.isEarned}
								isSolved={slot.isEarned}
								isMini={true}
							/>
						</div>
					);
				})}
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
