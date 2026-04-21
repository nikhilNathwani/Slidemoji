import { useState, useEffect, useRef } from "react";
import Dialog from "./Dialog";
import PuzzleListItem from "./PuzzleListItem";
import PaywallView from "../../payment/PaywallView";
import { useSubscription } from "../../payment/useSubscription";
import { useSolvedGames } from "../../hooks/useSolvedGames";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import { prefetchPuzzles } from "../../hooks/usePuzzle";
import { DIFFICULTY } from "../../constants";
import { FontAwesomeIcon, faClockRotateLeft } from "../../utils/icons";
import styles from "./ArchiveDialog.module.css";

function ArchiveDialog({ isOpen, onClose, onPuzzleSelect, devIsPremium }) {
	const { isPremium: firestoreIsPremium } = useSubscription();
	const { solvedGames } = useSolvedGames();
	const isPremium = devIsPremium ?? firestoreIsPremium;
	const [filter, setFilter] = useState("all");
	const todayPuzzleId = getLatestPuzzleId();
	const totalPuzzles = todayPuzzleId;

	// On first open, fire-and-forget prefetch of ALL puzzle docs not yet cached.
	// The latest 30 are already warm (eager prefetch in App.jsx), so this only
	// fetches the older ones and completes in the background while the user scrolls.
	const hasPrefetchedRef = useRef(false);
	useEffect(() => {
		if (!isOpen || hasPrefetchedRef.current) return;
		hasPrefetchedRef.current = true;
		const allIds = Array.from({ length: totalPuzzles }, (_, i) => i + 1);
		prefetchPuzzles(allIds);
	}, [isOpen, totalPuzzles]);

	// Generate list of all puzzles (1 to current puzzle number)
	const puzzleList = Array.from({ length: totalPuzzles }, (_, i) => {
		const puzzleNum = i + 1;
		const solved = solvedGames?.[puzzleNum];
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
							className={`selectorBtn ${filter === "all" ? "active" : ""}`}
							onClick={() => setFilter("all")}
						>
							<span>All</span>
							<span className="selectorBtnSubtitle">
								({totalPuzzles})
							</span>
						</button>
						<button
							className={`selectorBtn ${filter === "unsolved" ? "active" : ""}`}
							onClick={() => setFilter("unsolved")}
						>
							<span>Unsolved</span>
							<span className="selectorBtnSubtitle">
								({numUnsolved})
							</span>
						</button>
						<button
							className={`selectorBtn ${filter === "solved" ? "active" : ""}`}
							onClick={() => setFilter("solved")}
						>
							<span>Solved</span>
							<span className="selectorBtnSubtitle">
								({numSolved})
							</span>
						</button>
					</div>

					{/* Puzzle list */}
					<div className={styles.puzzleList}>
						{filteredPuzzles.length === 0 ? (
							<div className={styles.emptyState}>
								<p>No puzzles found</p>
							</div>
						) : (
							filteredPuzzles.map((puzzle) => (
								<PuzzleListItem
									key={puzzle.puzzleNum}
									puzzleNum={puzzle.puzzleNum}
									isSolved={puzzle.isSolved}
									onClick={handlePuzzleClick}
								/>
							))
						)}
					</div>
				</div>
			)}
		</Dialog>
	);
}

export default ArchiveDialog;
