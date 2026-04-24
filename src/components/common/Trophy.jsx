import { useState } from "react";
import { DIFFICULTY } from "../../constants";
import styles from "./Trophy.module.css";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import { usePuzzle } from "../../hooks/usePuzzle";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName,
	isMini = false,
	isEarned = false, // Whether the current difficulty is solved
	difficulty = DIFFICULTY.NORMAL, // Current difficulty being played/viewed
	celebrationKey = 0, // Incremented by Game each time a player move solves the puzzle
	isFuture = false, // True for placeholder slots not yet released
}) {
	// Skip fetch if caller already provided emoji, or if mini (nothing to display).
	const skipFetch = trophyEmoji || isMini || isFuture;
	const { data: puzzleData } = usePuzzle(skipFetch ? null : trophyNum);

	const emoji = trophyEmoji || puzzleData?.emoji;
	const name = trophyName || puzzleData?.emojiName;

	const [isCelebrating, setIsCelebrating] = useState(false);

	// Detect any increment of celebrationKey as a new solve event.
	// Using "storing previous render" (setState during render) avoids a cascading effect.
	const [prevCelebrationKey, setPrevCelebrationKey] =
		useState(celebrationKey);
	if (!isMini && celebrationKey !== prevCelebrationKey) {
		setPrevCelebrationKey(celebrationKey);
		setIsCelebrating(true);
	}

	return (
		<div
			className={[
				styles.trophy,
				isMini && styles.mini,
				isEarned && styles.earned,
				isEarned && styles[difficulty], //'difficulty' values match CSS class names
				isCelebrating && styles.celebrating,
				isFuture && styles.future,
			]
				.filter(Boolean)
				.join(" ")}
			onAnimationEnd={() => {
				setIsCelebrating(false);
			}}
		>
			{!isFuture && (
				<div className={styles.number}>{formatPuzzleId(trophyNum)}</div>
			)}
			{!isFuture && (isEarned || !isMini) && (
				<div className={styles.emoji}>{emoji}</div>
			)}
			{!isMini && name && <div>{name}</div>}
		</div>
	);
}

export default Trophy;
