import styles from "./TrophyStats.module.css";

function TrophyStats({ total, currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<div className={styles.runStats}>
				<span>Current run: {currentRun}</span>
				<span>Best run: {bestRun}</span>
			</div>
			<span>Total: {total}</span>
		</div>
	);
}

export default TrophyStats;
