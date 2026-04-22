import styles from "./TrophyStats.module.css";

function TrophyStats({ currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<span>
				Current run:{" "}
				<strong className={styles.val}>{currentRun}</strong>
				<span className={styles.sep}>·</span>
				Best run: <strong className={styles.val}>{bestRun}</strong>
			</span>
		</div>
	);
}

export default TrophyStats;
