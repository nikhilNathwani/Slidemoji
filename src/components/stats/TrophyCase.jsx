import {
	FontAwesomeIcon,
	faChevronLeft,
	faChevronRight,
} from "../../utils/icons";
import Trophy from "../common/Trophy";
import TrophyStats from "./TrophyStats";
import { DIFFICULTY } from "../../constants";
import styles from "./TrophyCase.module.css";
import { useState } from "react";

function TrophyCase({ solvedGames }) {
	const TROPHIES_PER_PAGE = 12;

	// Build a sorted list of earned trophies only (ascending by puzzle ID).
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

	// Compute current run (ending at the latest solved puzzle) and best run.
	// A run is a consecutive sequence of puzzle IDs with no gaps.
	const puzzleIds = earnedTrophies.map((t) => t.puzzleNum);
	let bestRun = numEarnedTrophies > 0 ? 1 : 0;
	let tempRun = numEarnedTrophies > 0 ? 1 : 0;
	for (let i = 1; i < puzzleIds.length; i++) {
		tempRun = puzzleIds[i] === puzzleIds[i - 1] + 1 ? tempRun + 1 : 1;
		if (tempRun > bestRun) bestRun = tempRun;
	}
	const currentRun = tempRun; // run ending at the highest solved puzzle ID

	const totalPages = Math.max(
		1,
		Math.ceil(numEarnedTrophies / TROPHIES_PER_PAGE),
	);

	const [currentPage, setCurrentPage] = useState(totalPages);

	const startIndex = (currentPage - 1) * TROPHIES_PER_PAGE;
	const trophySlots = earnedTrophies.slice(
		startIndex,
		startIndex + TROPHIES_PER_PAGE,
	);

	const handlePrevPage = () => {
		if (currentPage > 1) setCurrentPage(currentPage - 1);
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) setCurrentPage(currentPage + 1);
	};

	return (
		<div className={styles.trophyCase}>
			<div className={styles.trophyCard}>
				<TrophyStats
					total={numEarnedTrophies}
					currentRun={currentRun}
					bestRun={bestRun}
				/>
				{numEarnedTrophies === 0 ? (
					<p className={styles.emptyState}>
						Solve a puzzle to earn your first trophy!
					</p>
				) : (
					<>
						<div
							className={`${styles.trophyGrid}${totalPages > 1 ? ` ${styles.gridFixed}` : ""}`}
						>
							{trophySlots.map((slot) => (
								<Trophy
									key={slot.puzzleNum}
									trophyNum={slot.puzzleNum}
									isEarned={true}
									difficulty={
										slot.solvedDifficulty ||
										DIFFICULTY.NORMAL
									}
									isMini={true}
								/>
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
					</>
				)}
			</div>
		</div>
	);
}

export default TrophyCase;
