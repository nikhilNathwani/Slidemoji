import Trophy from "../common/Trophy";
import styles from "./PuzzleInfo.module.css";

function PuzzleInfo({ puzzleNumber, emoji, emojiName, maxDifficultySolved }) {
	return (
		<Trophy
			trophyNum={puzzleNumber}
			trophyEmoji={emoji}
			trophyName={emojiName}
			maxDifficultySolved={maxDifficultySolved}
		/>
	);
}

export default PuzzleInfo;
