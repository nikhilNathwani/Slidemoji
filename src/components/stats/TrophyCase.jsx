import {
	FontAwesomeIcon,
	faChevronLeft,
	faChevronRight,
} from "../../utils/icons";
import Trophy from "../common/Trophy";
import { DIFFICULTY } from "../../constants";
import styles from "./TrophyCase.module.css";
import { useState } from "react";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

function TrophyCase({ solvedGames, highlightPuzzleId }) {
	const TROPHIES_PER_PAGE = 12;
	const totalPuzzles = getLatestPuzzleId();
	const totalPages = Math.max(1, Math.ceil(totalPuzzles / TROPHIES_PER_PAGE));

	// Track manual pagination. null = user hasn't navigated yet.
	const [userSelectedPage, setUserSelectedPage] = useState(null);

	// Derive the "smart" default: the page containing highlightPuzzleId if given,
	// else the last page (most recent puzzles).
	const highlightPage = highlightPuzzleId
		? Math.ceil(highlightPuzzleId / TROPHIES_PER_PAGE)
		: null;

	// User selection wins; else show highlight page; else show last page.
	const currentPage = userSelectedPage ?? highlightPage ?? totalPages;

	const handlePrevPage = () =>
		setUserSelectedPage(Math.max(1, currentPage - 1));
	const handleNextPage = () =>
		setUserSelectedPage(Math.min(totalPages, currentPage + 1));

	const startIndex = (currentPage - 1) * TROPHIES_PER_PAGE;
	// Always fill the last page to a full TROPHIES_PER_PAGE so the grid never
	// looks sparse. Slots beyond totalPuzzles are "future" placeholders.
	const isLastPage = currentPage === totalPages;
	const slotsOnPage = isLastPage
		? TROPHIES_PER_PAGE
		: Math.min(TROPHIES_PER_PAGE, totalPuzzles - startIndex);
	const trophySlots = Array.from(
		{ length: slotsOnPage },
		(_, i) => {
			const puzzleNum = startIndex + i + 1;
			const isFuture = puzzleNum > totalPuzzles;
			const puzzleSolved = solvedGames?.[puzzleNum];
			let solvedDifficulty = null;
			if (!isFuture) {
				if (puzzleSolved?.[DIFFICULTY.HARD]) {
					solvedDifficulty = DIFFICULTY.HARD;
				} else if (puzzleSolved?.[DIFFICULTY.NORMAL]) {
					solvedDifficulty = DIFFICULTY.NORMAL;
				}
			}
			return { puzzleNum, solvedDifficulty, isFuture };
		},
	);

	return (
		<div className={styles.trophyCase}>
			<div className={styles.trophyCard}>
				<div
					className={`${styles.trophyGrid}${totalPages > 1 ? ` ${styles.gridFixed}` : ""}`}
				>
					{trophySlots.map((slot) => (
						<Trophy
							key={slot.puzzleNum}
							trophyNum={slot.puzzleNum}
							isEarned={slot.solvedDifficulty !== null}
							difficulty={
								slot.solvedDifficulty || DIFFICULTY.NORMAL
							}
							isFuture={slot.isFuture}
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
			</div>
		</div>
	);
}

export default TrophyCase;
