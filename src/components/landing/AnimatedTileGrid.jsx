import { useState, useEffect, useRef } from "react";
import styles from "./AnimatedTileGrid.module.css";

// Simple 3x3 grid showing tile sliding animation
function AnimatedTileGrid() {
	const [tiles, setTiles] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);
	const moveIntervalRef = useRef(null);
	const lastGapPositionRef = useRef(null);

	// Perform a random valid move
	const makeRandomMove = () => {
		setTiles((currentTiles) => {
			const gapIndex = currentTiles.indexOf(8);
			const row = Math.floor(gapIndex / 3);
			const col = gapIndex % 3;

			const validMoves = [];
			// Check all 4 directions, excluding the move that would undo the previous one
			if (row > 0 && gapIndex - 3 !== lastGapPositionRef.current)
				validMoves.push(gapIndex - 3); // Up
			if (row < 2 && gapIndex + 3 !== lastGapPositionRef.current)
				validMoves.push(gapIndex + 3); // Down
			if (col > 0 && gapIndex - 1 !== lastGapPositionRef.current)
				validMoves.push(gapIndex - 1); // Left
			if (col < 2 && gapIndex + 1 !== lastGapPositionRef.current)
				validMoves.push(gapIndex + 1); // Right

			if (validMoves.length === 0) return currentTiles;

			// Pick a random valid move
			const swapIndex =
				validMoves[Math.floor(Math.random() * validMoves.length)];

			// Track current gap position before swapping
			lastGapPositionRef.current = gapIndex;

			// Swap gap with selected tile
			const newTiles = [...currentTiles];
			[newTiles[gapIndex], newTiles[swapIndex]] = [
				newTiles[swapIndex],
				newTiles[gapIndex],
			];

			return newTiles;
		});
	};

	useEffect(() => {
		// Start making random moves every 1 second
		moveIntervalRef.current = setInterval(makeRandomMove, 1000);

		return () => {
			if (moveIntervalRef.current) {
				clearInterval(moveIntervalRef.current);
			}
		};
	}, []);

	return (
		<div className={styles.animatedTileGrid}>
			{tiles.map((tile, index) => (
				<div
					key={index}
					className={
						tile === 8
							? styles.animatedTileGap
							: styles.animatedTile
					}
				></div>
			))}
		</div>
	);
}

export default AnimatedTileGrid;
