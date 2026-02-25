import styles from "./PuzzleInfo.module.css";

function PuzzleInfo({ puzzleNumber, emoji, emojiName, visible }) {
	return (
		<div
			className={`${styles.puzzleInfo} ${visible ? styles.visible : styles.hidden}`}
		>
			<div className={styles.puzzleTitle}>#{puzzleNumber}</div>
			<div className={styles.puzzleEmoji}>{emoji}</div>
			<div className={styles.puzzleEmojiName}>"{emojiName}"</div>
		</div>
	);
}

export default PuzzleInfo;
