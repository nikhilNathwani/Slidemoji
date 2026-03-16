import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Trophy.module.css";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName = null,
	isMini = false,
	isLocked = false,
	isToday = false, // Today's puzzle (not yet solved)
	maxGridSizeSolved = 0, // 3 for 3x3 (gold), 4 for 4x4 (teal)
}) {
	// Determine variant-specific class based on props
	const variantClass = isLocked
		? styles.locked
		: !maxGridSizeSolved
			? styles.puzzleInfo
			: maxGridSizeSolved === 4
				? styles.special
				: styles.gold;

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
				<div className={styles.emoji}>{trophyEmoji}</div>
			)}
			{!isMini && trophyName && !isLocked && (
				<div className={styles.name}>{trophyName}</div>
			)}
		</div>
	);
}

export default Trophy;
