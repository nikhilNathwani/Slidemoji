import { FontAwesomeIcon } from "../../utils/icons";
import { usePuzzle } from "../../hooks/usePuzzle";
import styles from "./Trophy.module.css";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName = null,
	isMini = false,
	isLocked = false,
	isToday = false, // Today's puzzle (not yet solved)
	isSolved = false, // Whether puzzle is solved (gold) or not (grey)
}) {
	// Fetch puzzle data if emoji not provided (for trophy case display)
	// trophyNum is a string like "001", need to convert to number
	const puzzleId =
		typeof trophyNum === "string" ? parseInt(trophyNum, 10) : trophyNum;
	const { data: puzzleMetadata } = usePuzzle(
		!trophyEmoji && !isLocked && puzzleId ? puzzleId : null,
	);

	// Use provided emoji/name or fetch from puzzle data
	const emoji = trophyEmoji || puzzleMetadata?.emoji;
	const name = trophyName || puzzleMetadata?.emojiName;

	// Determine variant-specific class based on props (3x3 only)
	const variantClass = isLocked
		? styles.locked
		: isSolved
			? styles.gold
			: styles.puzzleInfo;

	return (
		<div
			className={`${styles.trophy} ${variantClass} ${isMini && styles.trophyMini}`}
		>
			<div className={styles.number}>
				#{String(trophyNum).padStart(3, "0")}
			</div>
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
