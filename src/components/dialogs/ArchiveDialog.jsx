import { useState } from "react";
import Dialog from "./Dialog";
import { usePuzzle } from "../../hooks/usePuzzle";
import { getLatestPuzzleId, formatPuzzleId } from "../../utils/puzzleUtils";
import { FontAwesomeIcon } from "../../utils/icons";
import { useCheckout } from "../../hooks/useCheckout";
import styles from "./ArchiveDialog.module.css";

function PuzzleListItem({ puzzleNum, isSolved, onClick, isLocked = false }) {
	const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleNum);

	const variantClass = isLocked
		? styles.locked
		: isSolved
			? styles.solved
			: styles.unsolved;

	return (
		<button
			className={`${styles.puzzleItem} ${variantClass}`}
			onClick={() => !isLocked && onClick(puzzleNum)}
			disabled={isLoading || isLocked}
		>
			<div className={styles.puzzleNumber}>
				{formatPuzzleId(puzzleNum)}
			</div>
			<div className={styles.puzzleName}>
				{isLoading ? (
					<span className={styles.loading}>Loading...</span>
				) : (
					puzzleMetadata?.emojiName || "Unknown Puzzle"
				)}
			</div>
			<FontAwesomeIcon
				icon={isLocked ? "lock" : "play-circle"}
				className={styles.playIcon}
			/>
		</button>
	);
}

function PaywallView({ puzzleList }) {
	const { startCheckout, isRedirecting, error } = useCheckout();
	const previewItems = puzzleList.slice(0, 6);

	return (
		<div className={styles.paywallContent}>
			<div className={styles.paywallListWrapper}>
				<div className={styles.puzzleList}>
					{previewItems.map((puzzle) => (
						<PuzzleListItem
							key={puzzle.puzzleNum}
							puzzleNum={puzzle.puzzleNum}
							isSolved={puzzle.isSolved}
							onClick={() => {}}
							isLocked={true}
						/>
					))}
				</div>
				<div className={styles.paywallOverlay} />
			</div>

			<div className={styles.paywallCta}>
				<div className={styles.priceHero}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>
						One-time purchase · No subscription
					</span>
				</div>

				<ul className={styles.featureList}>
					<li className={styles.featureItem}>
						<FontAwesomeIcon
							icon="calendar"
							className={styles.featureIcon}
						/>
						<div>
							<div className={styles.featureHeadline}>
								Every puzzle, forever
							</div>
							<div className={styles.featureDetail}>
								Play any past puzzle, any time.
							</div>
						</div>
					</li>
					<li className={styles.featureItem}>
						<FontAwesomeIcon
							icon="trophy"
							className={styles.featureIcon}
						/>
						<div>
							<div className={styles.featureHeadline}>
								Full trophy case
							</div>
							<div className={styles.featureDetail}>
								Track solves across all difficulties.
							</div>
						</div>
					</li>
				</ul>

				<button
					className={styles.unlockButton}
					onClick={startCheckout}
					disabled={isRedirecting}
				>
					{isRedirecting ? "Redirecting…" : "Unlock for $3"}
				</button>

				{error && <p className={styles.error}>{error}</p>}

				<p className={styles.securityNote}>
					<FontAwesomeIcon icon="shield-alt" />
					Secure payment via Stripe
				</p>
			</div>
		</div>
	);
}

function ArchiveDialog({
	isOpen,
	onClose,
	solvedPuzzles,
	currentPuzzleId,
	onPuzzleSelect,
	isPremium,
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
