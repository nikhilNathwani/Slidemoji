import Trophy from "../common/Trophy";
import styles from "./PuzzleInfo.module.css";

function PuzzleInfo({ puzzleNumber, emoji, emojiName, maxSolvedDifficulty }) {
	return (
		<Trophy
			trophyNum={puzzleNumber}
			trophyEmoji={emoji}
			trophyName={emojiName}
			maxSolvedDifficulty={maxSolvedDifficulty}
		/>
	);
}

export default PuzzleInfo;
