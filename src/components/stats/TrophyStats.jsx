import styles from "./TrophyStats.module.css";

function TrophyStats({ currentRun, bestRun }) {
	return (
		<div className={styles.statsRow}>
			<span>Current run: {currentRun}</span>
			<span>Best run: {bestRun}</span>
		</div>
	);
}

export default TrophyStats;
