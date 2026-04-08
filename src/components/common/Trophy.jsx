import { useState, useEffect } from "react";
import { FontAwesomeIcon, faLock, faUnlock } from "../../utils/icons";
import { DIFFICULTY } from "../../constants";
import styles from "./Trophy.module.css";
import { formatPuzzleId } from "../../utils/puzzleUtils";
import { usePuzzle } from "../../hooks/usePuzzle";

function Trophy({
	trophyNum,
	trophyEmoji,
	trophyName,
	isMini = false,
	isLocked = false,
	isToday = false, // Today's puzzle (not yet solved)
	isSolved = false, // Whether the current difficulty is solved
	difficulty = DIFFICULTY.NORMAL, // Current difficulty being played/viewed
	justSolvedByMove = false, // True only when the user's own move just solved the puzzle
}) {
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
	// celebrationPeaked: true once the 550ms timer fires (animation scale peak).
	// Used to derive showTrophyStyle without a separate state variable.
	const [celebrationPeaked, setCelebrationPeaked] = useState(false);

	// showTrophyStyle is derived: show trophy style when solved, but during the
	// early phase of celebration (before the animation peak) keep it grey so the
	// reveal lands at the visual peak rather than immediately.
	const showTrophyStyle = isMini
		? isSolved
		: isSolved && (!isCelebrating || celebrationPeaked);

	// Detect false → true transition in justSolvedByMove to start celebration.
	// Using "storing previous render" (setState during render) avoids a cascading effect.
	const [prevJustSolvedByMove, setPrevJustSolvedByMove] =
		useState(justSolvedByMove);
	if (prevJustSolvedByMove !== justSolvedByMove) {
		setPrevJustSolvedByMove(justSolvedByMove);
		if (!prevJustSolvedByMove && justSolvedByMove && !isMini) {
			setIsCelebrating(true);
		}
	}

	// At the animation scale peak (550ms), mark the celebration as peaked.
	// setState is only called asynchronously (inside setTimeout), not synchronously.
	useEffect(() => {
		if (!isCelebrating) return;
		const timer = setTimeout(() => setCelebrationPeaked(true), 550);
		return () => clearTimeout(timer);
	}, [isCelebrating]);

	// Determine variant-specific class based on difficulty
	// Normal, hard, or neutral (locked/unsolved)
	const variantClass = isLocked
		? styles.locked
		: !showTrophyStyle
			? styles.puzzleInfo // Grey for unsolved
			: difficulty === DIFFICULTY.HARD
				? styles.hard
				: styles.normal;

	return (
		<div
			className={`${styles.trophy} ${variantClass} ${isMini ? styles.trophyMini : ""} ${isCelebrating ? styles.celebrating : ""}`.trim()}
			onAnimationEnd={() => {
				setIsCelebrating(false);
				setCelebrationPeaked(false);
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
