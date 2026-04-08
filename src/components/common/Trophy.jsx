import { useState } from "react";
import { FontAwesomeIcon, faLock, faUnlock } from "../../utils/icons";
import { DIFFICULTY } from "../../constants";
import styles from "./Trophy.module.css";
import { formatPuzzleId, getLatestPuzzleId } from "../../utils/puzzleUtils";
import { usePuzzle } from "../../hooks/usePuzzle";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName,
	isMini = false,
	isSolved = false, // Whether the current difficulty is solved
	difficulty = DIFFICULTY.NORMAL, // Current difficulty being played/viewed
	celebrationKey = 0, // Incremented by Game each time a player move solves the puzzle
}) {
	// Locked: mini trophies that haven't been solved yet (trophy case unsolved slots).
	const isLocked = isMini && !isSolved;
	// Show unlock icon for today's unsolved (locked) puzzle, lock icon for all others.
	const isToday = isLocked && trophyNum === getLatestPuzzleId();

	// Self-fetch emoji/name when not provided (trophy case displays).
	// usePuzzle returns null when puzzleId is null, so no fetch for locked slots.
	const puzzleId =
		!trophyEmoji && !isLocked && trophyNum != null
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

	// Determine variant-specific class based on difficulty
	// Normal, hard, or neutral (locked/unsolved)
	const variantClass = isLocked
		? styles.locked
		: !isSolved
			? styles.puzzleInfo // Grey for unsolved
			: difficulty === DIFFICULTY.HARD
				? styles.hard
				: styles.normal;

	return (
		<div
			className={`${styles.trophy} ${variantClass} ${isMini ? styles.trophyMini : ""} ${isCelebrating ? styles.celebrating : ""}`.trim()}
			onAnimationEnd={() => {
				setIsCelebrating(false);
			}}
		>
			<div className={styles.number}>{formatPuzzleId(trophyNum)}</div>
			{isLocked ? (
				<div className={styles.lockIcon}>
					<FontAwesomeIcon icon={isToday ? faUnlock : faLock} />
				</div>
			) : (
				<div className={styles.emoji}>{emoji}</div>
			)}
			{!isMini && name && !isLocked && (
				<div className={styles.name}>{name}</div>
			)}
		</div>
	);
}

export default Trophy;
