import styles from "./TrophyStats.module.css";

function TrophyStats({ currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<span>
				Current run:{" "}
				<span className={styles.statValue}>{currentRun}</span>
				<span className={styles.separator}>|</span>
				Best run: <span className={styles.statValue}>{bestRun}</span>
			</span>
		</div>
	);
}

export default TrophyStats;
