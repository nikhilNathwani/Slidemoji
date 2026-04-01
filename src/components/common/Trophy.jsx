import { FontAwesomeIcon } from "../../utils/icons";
import { DIFFICULTY } from "../../constants";
import styles from "./Trophy.module.css";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import { usePuzzle } from "../../hooks/usePuzzle";

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
	// Self-fetch emoji/name when not provided (trophy case displays).
	// usePuzzle returns null when puzzleId is null, so no fetch for locked slots.
	const puzzleId =
		!trophyEmoji && !isLocked && trophyNum != null
			? typeof trophyNum === "string"
				? parseInt(trophyNum, 10)
				: trophyNum
			: null;
	const { data: puzzleData } = usePuzzle(puzzleId);

	const emoji = trophyEmoji || puzzleData?.emoji;
	const name = trophyName || puzzleData?.emojiName;

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
				<div className={styles.emoji}>{emoji}</div>
			)}
			{!isMini && name && !isLocked && (
				<div className={styles.name}>{name}</div>
			)}
		</div>
	);
}

export default Trophy;
