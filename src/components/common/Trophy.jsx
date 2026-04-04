import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "../../utils/icons";
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
	// showTrophyStyle delays the visual trophy switch until the animation peak
	const [showTrophyStyle, setShowTrophyStyle] = useState(isSolved);

	// Celebration trigger: only fires when an actual move solved the puzzle.
	// Using justSolvedByMove (false → true) avoids false replays on sign-in
	// data reloads where isSolved can blip false → true without a real solve.
	const prevJustSolvedByMoveRef = useRef(false);
	useEffect(() => {
		const isNewSolve =
			!prevJustSolvedByMoveRef.current && justSolvedByMove;
		prevJustSolvedByMoveRef.current = justSolvedByMove;

		if (isMini || !isNewSolve) return;
		setIsCelebrating(true);
		// Switch to trophy style at the scale-1.12 peak (350ms start + 40% of 500ms = 550ms)
		const timer = setTimeout(() => setShowTrophyStyle(true), 550);
		return () => clearTimeout(timer);
	}, [justSolvedByMove, isMini]);

	// Trophy style: update on isSolved changes when not mid-celebration.
	// Skips updates while justSolvedByMove is true to prevent auth-reload flickers.
	useEffect(() => {
		if (isMini) {
			setShowTrophyStyle(isSolved);
			return;
		}
		if (!justSolvedByMove) {
			setShowTrophyStyle(isSolved);
		}
	}, [isSolved, justSolvedByMove, isMini]);

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
			onAnimationEnd={() => setIsCelebrating(false)}
		>
			<div className={styles.number}>{formatPuzzleId(trophyNum)}</div>
			{isLocked ? (
				<div className={styles.lockIcon}>
					<FontAwesomeIcon icon={isToday ? "unlock" : "lock"} />
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
