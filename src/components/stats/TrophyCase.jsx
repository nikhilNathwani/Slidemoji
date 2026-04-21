import {
	FontAwesomeIcon,
	faTrophy,
	faChevronLeft,
	faChevronRight,
} from "../../utils/icons";
import Trophy from "../common/Trophy";
import { DIFFICULTY } from "../../constants";
import styles from "./TrophyCase.module.css";
import { useState } from "react";

function TrophyCase({ totalPuzzles = 12, solvedPuzzles, showTitle = true }) {
	const TROPHIES_PER_PAGE = 12;
	const totalPages = Math.ceil(totalPuzzles / TROPHIES_PER_PAGE);
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	const [currentPage, setCurrentPage] = useState(totalPages);

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
				puzzleNum,
				isPlaceholder: true,
			});
		} else {
			// solvedPuzzles[id] = { DIFFICULTY.NORMAL: true, DIFFICULTY.HARD: true } | undefined
			const puzzleSolved = solvedPuzzles?.[puzzleNum];

			// Determine max difficulty for trophy case display (DIFFICULTY.HARD > DIFFICULTY.NORMAL)
			let solvedDifficulty = null;
			if (puzzleSolved?.[DIFFICULTY.HARD]) {
				solvedDifficulty = DIFFICULTY.HARD;
			} else if (puzzleSolved?.[DIFFICULTY.NORMAL]) {
				solvedDifficulty = DIFFICULTY.NORMAL;
			}

			trophySlots.push({
				puzzleNum,
				isPlaceholder: false,
				solvedDifficulty, // DIFFICULTY.NORMAL | DIFFICULTY.HARD | null (max difficulty)
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
					<FontAwesomeIcon icon={faTrophy} /> Trophy Case
					<span className={styles.trophyCount}>
						{numEarnedTrophies}/{totalPuzzles}
					</span>
				</h3>
			)}

			<div className={styles.trophyCard}>
				<div className={styles.trophyGrid}>
					{trophySlots.map((slot) => (
						<div
							key={slot.puzzleNum}
							style={{
								visibility: slot.isPlaceholder
									? "hidden"
									: "visible",
							}}
						>
							{!slot.isPlaceholder && (
								<Trophy
									trophyNum={slot.puzzleNum}
									isEarned={!!slot.solvedDifficulty}
									difficulty={
										slot.solvedDifficulty ||
										DIFFICULTY.NORMAL
									}
									isMini={true}
								/>
							)}
						</div>
					))}
				</div>
				{totalPages > 1 && (
					<div className={styles.pagination}>
						<button
							className={`btn-icon ${styles.paginationButton}`}
							onClick={handlePrevPage}
							disabled={currentPage === 1}
							aria-label="Previous page"
						>
							<FontAwesomeIcon icon={faChevronLeft} />
						</button>
						<span className={styles.pageInfo}>
							Page {currentPage} of {totalPages}
						</span>
						<button
							className={`btn-icon ${styles.paginationButton}`}
							onClick={handleNextPage}
							disabled={currentPage === totalPages}
							aria-label="Next page"
						>
							<FontAwesomeIcon icon={faChevronRight} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default TrophyCase;
