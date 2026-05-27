import styles from "./Tile.module.css";
import { motion, useReducedMotion } from "framer-motion";

function getTileStyle(tileNumber, gridSize, emojiSvgUrl) {
	const style = {};

	if (emojiSvgUrl && tileNumber) {
		const position = tileNumber - 1;
		const row = Math.floor(position / gridSize);
		const col = position % gridSize;

		// Calculate background positioning for pixel-perfect emoji alignment
		const bgSizePercent = gridSize * 100;
		const bgPosXPercent = (col / (gridSize - 1)) * 100;
		const bgPosYPercent = (row / (gridSize - 1)) * 100;

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `${bgPosXPercent}% ${bgPosYPercent}%`;
	}
	return style;
}

function Tile({
	tileNumber,
	gridSize,
	emojiSvgUrl,
	hasNumbersShown,
	isClickable,
	isGap = false,
	onPointerDown,
	celebrating = false,
	celebrationDelay = 0,
}) {
	const shouldReduceMotion = useReducedMotion();
	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);
	if (celebrating) classNames.push(styles.celebrating);

	if (isGap) {
		return <div className={styles.gap} aria-hidden="true" />;
	}

	const transition = { type: "spring", stiffness: 400, damping: 35 };
	const Wrapper = shouldReduceMotion ? "div" : motion.div;
	const wrapperProps = shouldReduceMotion ? {} : { layout: true, transition };

	// Two-div structure: outer wrapper handles layout movement (Motion layout in
	// normal mode, plain wrapper in reduced-motion mode), while the inner tile
	// handles win celebration scale via CSS keyframes.
	// Keeping them separate prevents celebration scale from clobbering layout movement.
	return (
		<Wrapper {...wrapperProps}>
			<div
				className={classNames.join(" ")}
				{...(isClickable && { onPointerDown })}
				style={{
					width: "100%",
					height: "100%",
					...getTileStyle(tileNumber, gridSize, emojiSvgUrl),
					...(celebrating && {
						animationDelay: `${celebrationDelay}ms`,
						"--celebration-delay": `${celebrationDelay}ms`,
					}),
				}}
				data-tile-number={tileNumber}
			>
				{hasNumbersShown && tileNumber ? (
					<span className={styles.tileNumber}>{tileNumber}</span>
				) : null}
			</div>
		</Wrapper>
	);
}

export default Tile;
