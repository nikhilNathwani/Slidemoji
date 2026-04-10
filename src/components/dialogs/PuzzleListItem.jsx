import { usePuzzle } from "../../hooks/usePuzzle";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import { FontAwesomeIcon, faLock, faPlayCircle } from "../../utils/icons";
import styles from "./PuzzleListItem.module.css";

function PuzzleListItem({ puzzleNum, isSolved, isSolvedHard = false, onClick, isLocked = false }) {
	const { data: puzzleMetadata, isLoading } = usePuzzle(puzzleNum);

	const variantClass = isLocked
		? styles.locked
		: isSolvedHard
			? styles.solvedHard
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
				icon={isLocked ? faLock : faPlayCircle}
				className={styles.playIcon}
			/>
		</button>
	);
}

export default PuzzleListItem;
