import styles from "./TrophyStats.module.css";

function TrophyStats({ total, currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<div className={styles.statChip}>
				<span className={styles.statValue}>{currentRun}</span>
				<span className={styles.statLabel}>Current run</span>
			</div>
			<div className={styles.statDivider} />
			<div className={styles.statChip}>
				<span className={styles.statValue}>{bestRun}</span>
				<span className={styles.statLabel}>Best run</span>
			</div>
			<div className={styles.statDivider} />
			<div className={styles.statChip}>
				<span className={styles.statValue}>{total}</span>
				<span className={styles.statLabel}>Total</span>
			</div>
		</div>
	);
}

export default TrophyStats;
