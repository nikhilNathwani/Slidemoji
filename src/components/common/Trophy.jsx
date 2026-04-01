import { FontAwesomeIcon } from "../../utils/icons";
import { DIFFICULTY } from "../../constants";
import styles from "./Trophy.module.css";
import { formatPuzzleId } from "../../utils/puzzleUtils";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName,
	isMini = false,
	isLocked = false,
	isToday = false, // Today's puzzle (not yet solved)
	isSolved = false, // Whether the current difficulty is solved
	difficulty = DIFFICULTY.NORMAL, // Current difficulty being played/viewed
}) {
	// Determine variant-specific class based on difficulty
	// Normal, hard, or neutral (locked/unsolved)
	const variantClass = isLocked
		? styles.locked
		: !isSolved
			? styles.puzzleInfo // Grey for unsolved
			: difficulty === DIFFICULTY.HARD
				? styles.hard
				: styles.normal;

	return (
		<div
			className={`${styles.trophy} ${variantClass} ${isMini && styles.trophyMini}`}
		>
			<div className={styles.number}>{formatPuzzleId(trophyNum)}</div>
			{isLocked ? (
				<div className={styles.lockIcon}>
					<FontAwesomeIcon icon={isToday ? "unlock" : "lock"} />
				</div>
			) : (
				<div className={styles.emoji}>{trophyEmoji}</div>
			)}
			{!isMini && name && !isLocked && (
				<div className={styles.name}>{trophyName}</div>
			)}
		</div>
	);
}

export default Trophy;
