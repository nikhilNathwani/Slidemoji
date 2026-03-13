import Trophy from "../common/Trophy";
import styles from "./PuzzleInfo.module.css";

function PuzzleInfo({
	puzzleNumber,
	emoji,
	emojiName,
	highestCompletedDifficulty,
}) {
	return (
		<Trophy
			trophyNum={puzzleNumber}
			trophyEmoji={emoji}
			trophyName={emojiName}
			highestCompletedDifficulty={highestCompletedDifficulty}
		/>
	);
}

export default PuzzleInfo;
