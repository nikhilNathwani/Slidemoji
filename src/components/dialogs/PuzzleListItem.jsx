import { usePuzzle } from "../../hooks/usePuzzle";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import {
	FontAwesomeIcon,
	faLock,
	faPlayCircle,
	faCheck,
} from "../../utils/icons";
import styles from "./PuzzleListItem.module.css";

function PuzzleListItem({
	puzzleNum,
	isSolved = false,
	onClick,
	isLocked = false,
}) {
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
			<div className={styles.iconSlot}>
				<FontAwesomeIcon
					icon={isLocked ? faLock : faPlayCircle}
					className={`${styles.playIcon} ${isSolved ? styles.playIconSolved : ""}`}
				/>
				{isSolved && (
					<FontAwesomeIcon
						icon={faCheck}
						className={styles.checkIcon}
					/>
				)}
			</div>
		</button>
	);
}

export default PuzzleListItem;
