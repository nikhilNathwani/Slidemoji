import styles from "./Trophy.module.css";

function Trophy({ trophyNum, trophyEmoji, trophyName = null, isMini = false }) {
	return (
		<div className={`${styles.trophy} ${isMini ? styles.trophyMini : ""}`}>
			<div className={styles.number}>
				#{String(trophyNum).padStart(3, "0")}
			</div>
			<div className={styles.emoji}>{trophyEmoji}</div>
			{!isMini && trophyName && (
				<div className={styles.name}>"{trophyName}"</div>
			)}
		</div>
	);
}

export default Trophy;
