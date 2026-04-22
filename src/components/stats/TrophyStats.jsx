import styles from "./TrophyStats.module.css";

function TrophyStats({ total, currentRun, bestRun }) {
	return (
		<p className={styles.statsLine}>
			Current run: {currentRun}
			<span className={styles.sep}>|</span>
			Best run: {bestRun}
			<span className={styles.sep}>|</span>
			Total: {total}
		</p>
	);
}

export default TrophyStats;
