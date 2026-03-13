import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Trophy.module.css";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName = null,
	isMini = false,
	isLocked = false,
	highestCompletedDifficulty = 0, // 3 for normal (gold), 4 for hard (green)
	visible = true,
}) {
	// Determine variant-specific class based on boolean props
	const variantClass = isLocked
		? styles.locked
		: !highestCompletedDifficulty
			? styles.puzzleInfo
			: highestCompletedDifficulty === 4
				? styles.special
				: styles.gold;

	// Visibility class (only applies when not earned and not locked)
	const visibilityClass =
		!highestCompletedDifficulty && !isLocked
			? visible
				? styles.visible
				: styles.hidden
			: "";

	return (
		<div
			className={`${styles.trophy} ${variantClass} ${isMini && styles.trophyMini} ${visibilityClass}`}
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
