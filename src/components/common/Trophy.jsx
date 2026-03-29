import { FontAwesomeIcon } from "../../utils/icons";
import { DIFFICULTY } from "../../constants";
import { getPuzzleCatalogEntry } from "../../utils/puzzleCatalog";
import styles from "./Trophy.module.css";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName = null,
	isMini = false,
	isLocked = false,
	isToday = false, // Today's puzzle (not yet solved)
	isSolved = false, // Whether the current difficulty is solved
	difficulty = DIFFICULTY.NORMAL, // Current difficulty being played/viewed
}) {
	// trophyNum is a string like "001", need to convert to number
	const puzzleId =
		typeof trophyNum === "string" ? parseInt(trophyNum, 10) : trophyNum;
	const puzzleCatalogEntry =
		!trophyEmoji && !isLocked && puzzleId
			? getPuzzleCatalogEntry(puzzleId)
			: null;

	// Use provided emoji/name or local puzzle catalog data
	const emoji = trophyEmoji || puzzleCatalogEntry?.emoji;
	const name = trophyName || puzzleCatalogEntry?.emojiName;

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
