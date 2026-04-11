import { usePuzzle } from "../../hooks/usePuzzle";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import { FontAwesomeIcon, faLock, faPlayCircle } from "../../utils/icons";
import styles from "./PuzzleListItem.module.css";

function PuzzleListItem({
	puzzleNum,
	isSolvedNormal = false,
	isSolvedHard = false,
	onClick,
	isLocked = false,
}) {
	const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleNum);

	const isSolved = isSolvedNormal || isSolvedHard;
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
			{!isLocked && isSolved && (
				<div className={styles.solveIndicators}>
					{isSolvedNormal && <span className={`${styles.pip} ${styles.normalPip}`} aria-label="Solved normal" />}
					{isSolvedHard && <span className={`${styles.pip} ${styles.hardPip}`} aria-label="Solved hard" />}
				</div>
			)}
			<FontAwesomeIcon
				icon={isLocked ? faLock : faPlayCircle}
				className={styles.playIcon}
			/>
		</button>
	);
}

export default PuzzleListItem;
