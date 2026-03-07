import { FontAwesomeIcon } from "../../utils/icons";
import Trophy from "./Trophy";
import styles from "./TrophyCase.module.css";

function TrophyCase({
	dailyEmoji,
	earnedPuzzleIds = new Set(),
	totalPuzzles = 12,
}) {
	// Generate trophy slots (with gaps for missed puzzles)
	const trophySlots = [];
	for (let i = 1; i <= totalPuzzles; i++) {
		const isEarned = earnedPuzzleIds.has(i);
		trophySlots.push({
			puzzleNum: i,
			isEarned,
			emoji: isEarned ? (i === 1 ? dailyEmoji.emoji : "🎨") : null, // Mock emoji
			name: isEarned
				? i === 1
					? dailyEmoji.name
					: "Daily Puzzle"
				: null,
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
