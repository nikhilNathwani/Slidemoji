import Trophy from "../common/Trophy";

function PuzzleInfo({ puzzleNumber, emoji, emojiName, maxGridSizeSolved }) {
	return (
		<Trophy
			trophyNum={puzzleNumber}
			trophyEmoji={emoji}
			trophyName={emojiName}
			maxGridSizeSolved={maxGridSizeSolved}
		/>
	);
}

export default PuzzleInfo;
