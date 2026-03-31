import { useState } from "react";
import Dialog from "./Dialog";
import { usePuzzle } from "../../hooks/usePuzzle";
import { getLatestPuzzleId, getPaddedString } from "../../utils/puzzleUtils";
import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./ArchiveDialog.module.css";

function PuzzleListItem({ puzzleNum, isSolved, onClick }) {
	const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleNum);

	const variantClass = isSolved ? styles.solved : styles.unsolved;

	return (
		<button
			className={`${styles.puzzleItem} ${variantClass}`}
			onClick={() => onClick(puzzleNum)}
			disabled={isLoading}
		>
			<div className={styles.puzzleNumber}>
				{getPaddedString(puzzleNum)}
			</div>
			<div className={styles.puzzleName}>
				{isLoading ? (
					<span className={styles.loading}>Loading...</span>
				) : (
					puzzleMetadata?.emojiName || "Unknown Puzzle"
				)}
			</div>
			<FontAwesomeIcon icon="play-circle" className={styles.playIcon} />
		</button>
	);
}

function ArchiveDialog({
	isOpen,
	onClose,
	solvedPuzzles,
	currentPuzzleId,
	onPuzzleSelect,
}) {
	const [filter, setFilter] = useState("all");
	const totalPuzzles = getLatestPuzzleId();

	// Generate list of all puzzles (1 to current puzzle number)
	const puzzleList = Array.from({ length: totalPuzzles }, (_, i) => {
		const puzzleNum = i + 1;
		return {
			puzzleNum,
			isSolved: !!solvedPuzzles?.[puzzleNum],
			isToday: puzzleNum === currentPuzzleId,
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
						icon="clock-rotate-left"
						className={styles.archiveIcon}
					/>{" "}
					Puzzle Archive
				</>
			}
		>
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
		</Dialog>
	);
}

export default ArchiveDialog;
