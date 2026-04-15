import { useState } from "react";
import Dialog from "./Dialog";
import PuzzleListItem from "./PuzzleListItem";
import PaywallView from "../../payment/PaywallView";
import { useSubscription } from "../../payment/useSubscription";
import { useSolvedPuzzles } from "../../hooks/useSolvedPuzzles";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import { DIFFICULTY } from "../../constants";
import { FontAwesomeIcon, faClockRotateLeft } from "../../utils/icons";
import styles from "./ArchiveDialog.module.css";

function ArchiveDialog({ isOpen, onClose, onPuzzleSelect, devIsPremium }) {
	const { isPremium: firestoreIsPremium } = useSubscription();
	const { solvedPuzzles } = useSolvedPuzzles();
	const isPremium = devIsPremium ?? firestoreIsPremium;
	const [filter, setFilter] = useState("all");
	const todayPuzzleId = getLatestPuzzleId();
	const totalPuzzles = todayPuzzleId;

	// Generate list of all puzzles (1 to current puzzle number)
	const puzzleList = Array.from({ length: totalPuzzles }, (_, i) => {
		const puzzleNum = i + 1;
		const solved = solvedPuzzles?.[puzzleNum];
		return {
			puzzleNum,
			isSolved: !!solved,
			isSolvedNormal: !!solved?.[DIFFICULTY.NORMAL],
			isSolvedHard: !!solved?.[DIFFICULTY.HARD],
			isToday: puzzleNum === todayPuzzleId,
		};
	}).reverse(); // Most recent first

	// Filter puzzles based on selected filter
	const filteredPuzzles = puzzleList.filter((puzzle) => {
		if (filter === "all") return true;
		if (filter === "unsolved") return !puzzle.isSolved;
		if (filter === "solved") return puzzle.isSolved;
		return true;
	});

	const handlePuzzleClick = (puzzleNum) => {
		onPuzzleSelect(puzzleNum);
		onClose();
	};

	const numSolved = puzzleList.filter((p) => p.isSolved).length;
	const numUnsolved = totalPuzzles - numSolved;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<>
					<FontAwesomeIcon
						icon={faClockRotateLeft}
						className={styles.archiveIcon}
					/>{" "}
					Puzzle Archive
				</>
			}
		>
			{!isPremium ? (
				<PaywallView puzzleList={puzzleList} />
			) : (
				<div className={styles.archiveContent}>
					{/* Filter buttons */}
					<div className={styles.filterBar}>
						<button
							className={`${styles.filterButton} ${filter === "all" ? styles.active : ""}`}
							onClick={() => setFilter("all")}
						>
							<span>All</span>
							<span className={styles.filterCount}>
								({totalPuzzles})
							</span>
						</button>
						<button
							className={`${styles.filterButton} ${filter === "unsolved" ? styles.active : ""}`}
							onClick={() => setFilter("unsolved")}
						>
							<span>Unsolved</span>
							<span className={styles.filterCount}>
								({numUnsolved})
							</span>
						</button>
						<button
							className={`${styles.filterButton} ${filter === "solved" ? styles.active : ""}`}
							onClick={() => setFilter("solved")}
						>
							<span>Solved</span>
							<span className={styles.filterCount}>
								({numSolved})
							</span>
						</button>
					</div>

					{/* Puzzle list */}
					<div className={styles.puzzleList}>
						{filteredPuzzles.map((puzzle) => (
							<PuzzleListItem
								key={puzzle.puzzleNum}
								puzzleNum={puzzle.puzzleNum}
								isSolved={puzzle.isSolved}
								onClick={handlePuzzleClick}
							/>
						))}
					</div>

					{filteredPuzzles.length === 0 && (
						<div className={styles.emptyState}>
							<p>No puzzles found</p>
						</div>
					)}
				</div>
			)}
		</Dialog>
	);
}

export default ArchiveDialog;
