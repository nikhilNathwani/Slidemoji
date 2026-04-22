import styles from "./TrophyStats.module.css";

function TrophyStats({ total, currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<span className={styles.statGroup}>
				Current run: {currentRun}
				<span className={styles.sep}>·</span>
				Best run: {bestRun}
			</span>
			<span className={styles.statGroup}>Total: {total}</span>
		</div>
	);
}

export default TrophyStats;
