import styles from "./TrophyStats.module.css";

function TrophyStats({ currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<span>
				Current run:{" "}
				<strong className={styles.statValue}>{currentRun}</strong>
				<span className={styles.separator}>|</span>
				Best run: <strong className={styles.statValue}>{bestRun}</strong>
			</span>
		</div>
	);
}

export default TrophyStats;
