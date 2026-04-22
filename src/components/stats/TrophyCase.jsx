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

function TrophyCase({ totalPuzzles = 12, solvedGames, showTitle = true }) {
	const TROPHIES_PER_PAGE = 12;

	// Build a sorted list of earned trophies only (ascending by puzzle ID).
	// No placeholders — unearned puzzles are not shown.
	const earnedTrophies = Object.entries(solvedGames || {})
		.map(([id, puzzleSolved]) => {
			let solvedDifficulty = null;
			if (puzzleSolved?.[DIFFICULTY.HARD]) {
				solvedDifficulty = DIFFICULTY.HARD;
			} else if (puzzleSolved?.[DIFFICULTY.NORMAL]) {
				solvedDifficulty = DIFFICULTY.NORMAL;
			}
			return { puzzleNum: Number(id), solvedDifficulty };
		})
		.sort((a, b) => a.puzzleNum - b.puzzleNum);

	const numEarnedTrophies = earnedTrophies.length;
	const totalPages = Math.max(1, Math.ceil(numEarnedTrophies / TROPHIES_PER_PAGE));

	const [currentPage, setCurrentPage] = useState(totalPages);

	const startIndex = (currentPage - 1) * TROPHIES_PER_PAGE;
	const trophySlots = earnedTrophies.slice(startIndex, startIndex + TROPHIES_PER_PAGE);

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
