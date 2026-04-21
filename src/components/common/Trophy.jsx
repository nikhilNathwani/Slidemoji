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
}) {
	// Self-fetch emoji/name when not provided (trophy case displays).
	// No fetch for mini+unearned slots — nothing to show.
	const puzzleId =
		!trophyEmoji && (isEarned || !isMini) && trophyNum != null
			? typeof trophyNum === "string"
				? parseInt(trophyNum, 10)
				: trophyNum
			: null;
	const { data: puzzleData } = usePuzzle(puzzleId);

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

	// .earned + .normal/.hard always travel together — earned provides shared visuals,
	// .normal/.hard bind the color palette tokens.
	const earnedClasses = isEarned
		? [styles.earned, difficulty === DIFFICULTY.HARD ? styles.hard : styles.normal]
		: [];

	return (
		<div
			className={[
				styles.trophy,
				isMini && styles.mini,
				...earnedClasses,
				isCelebrating && styles.celebrating,
			]
				.filter(Boolean)
				.join(" ")}
			onAnimationEnd={() => {
				setIsCelebrating(false);
			}}
		>
			<div className={styles.number}>{formatPuzzleId(trophyNum)}</div>
			{(isEarned || !isMini) && (
				<div className={styles.emoji}>{emoji}</div>
			)}
			{!isMini && name && <div>{name}</div>}
		</div>
	);
}

export default Trophy;
