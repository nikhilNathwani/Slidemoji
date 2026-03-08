import { FontAwesomeIcon } from "../../utils/icons";
import Trophy from "./Trophy";
import styles from "./TrophyCase.module.css";

function TrophyCase({
	dailyEmoji,
	earnedPuzzleIds = new Set(),
	totalPuzzles = 12,
	userData,
}) {
	// Generate trophy slots (with gaps for missed puzzles)
	const trophySlots = [];
	for (let i = 1; i <= totalPuzzles; i++) {
		const isEarned = earnedPuzzleIds.has(i);
		// Get actual emoji from userData completedPuzzles if available
		let emoji = null;
		let name = null;
		if (isEarned && userData?.stats?.completedPuzzles?.[i]) {
			// Get emoji from first completed difficulty for this puzzle
			const difficulties = Object.keys(
				userData.stats.completedPuzzles[i],
			);
			if (difficulties.length > 0) {
				const puzzleData = userData.stats.completedPuzzles[i][difficulties[0]];
				emoji = puzzleData?.emoji || null;
				name = puzzleData?.emojiName || null;
			}
		}
		trophySlots.push({
			puzzleNum: i,
			isEarned,
			emoji,
			name,
		});
	}

	return (
		<div className={styles.trophyCase}>
			<h3>
				<FontAwesomeIcon icon="trophy" /> Trophy Case
				<span className={styles.trophyCount}>
					{earnedPuzzleIds.size}/{totalPuzzles}
				</span>
			</h3>
			<div className={styles.emojiGrid}>
				{trophySlots.map((slot) => (
					<Trophy
						key={slot.puzzleNum}
						trophyNum={slot.puzzleNum}
						trophyEmoji={slot.emoji}
						trophyName={slot.name}
						isLocked={!slot.isEarned}
						isEarned={slot.isEarned}
						difficulty={3}
						isMini={true}
					/>
				))}
			</div>
		</div>
	);
}

export default TrophyCase;
