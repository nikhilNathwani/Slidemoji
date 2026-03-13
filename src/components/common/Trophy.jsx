import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Trophy.module.css";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName = null,
	isMini = false,
	isLocked = false,
	maxSolvedDifficulty = 0, // 3 for normal (gold), 4 for hard (teal)
}) {
	// Determine variant-specific class based on boolean props
	const variantClass = isLocked
		? styles.locked
		: !maxSolvedDifficulty
			? styles.puzzleInfo
			: maxSolvedDifficulty === 4
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
					<FontAwesomeIcon icon="lock" />
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
