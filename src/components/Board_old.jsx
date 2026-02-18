import { useEffect, useState, useRef, useCallback } from "react";
import Tile from "./Tile";
import { isAdjacent, getAdjacentIndices } from "../utils/adjacency";

// ===== Helper Functions (outside component) =====

function getSolvedState(size) {
	return [...Array(size * size - 1)].map((_, i) => i + 1).concat(null);
}

function getGapIndex(tiles) {
	return tiles.indexOf(null);
}

function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles];
	[newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
	return newTiles;
}

function checkWin(tiles, solvedState) {
	return tiles.every((tile, index) => tile === solvedState[index]);
}

function scramblePuzzle(size, numMoves = 100) {
	let tiles = [...getSolvedState(size)];
	let gapIndex = getGapIndex(tiles);

	for (let i = 0; i < numMoves; i++) {
		const validMoves = getAdjacentIndices(gapIndex, size);
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		[tiles[gapIndex], tiles[randomMove]] = [
			tiles[randomMove],
			tiles[gapIndex],
		];
		gapIndex = randomMove;
	}

	return tiles;
}

// ===== FLIP Animation Helpers =====

function captureTilePositions(tileElement, gapElement) {
	const tileRect = tileElement.getBoundingClientRect();
	const gapRect = gapElement.getBoundingClientRect();
	let deltaX = gapRect.left - tileRect.left;
	let deltaY = gapRect.top - tileRect.top;

	// Snap very small deltas to 0 to prevent wobble from subpixel rendering differences
	const SNAP_THRESHOLD = 5; // pixels
	if (Math.abs(deltaX) < SNAP_THRESHOLD) deltaX = 0;
	if (Math.abs(deltaY) < SNAP_THRESHOLD) deltaY = 0;

	console.log("📏 CAPTURE POSITIONS:");
	console.log(
		`  Tile: left=${tileRect.left.toFixed(2)}, top=${tileRect.top.toFixed(2)}`,
	);
	console.log(
		`  Gap:  left=${gapRect.left.toFixed(2)}, top=${gapRect.top.toFixed(2)}`,
	);
	console.log(
		`  Delta (raw): x=${(gapRect.left - tileRect.left).toFixed(2)}, y=${(gapRect.top - tileRect.top).toFixed(2)}`,
	);
	console.log(
		`  Delta (snapped): x=${deltaX.toFixed(2)}, y=${deltaY.toFixed(2)}`,
	);

	return { deltaX, deltaY };
}

// ===== Keyboard Control Helpers =====

function getTileIndexFromDirection(gapIndex, direction, size) {
	const gapRow = Math.floor(gapIndex / size);
	const gapCol = gapIndex % size;

	const directionMap = {
		ArrowUp: { row: gapRow + 1, col: gapCol }, // Tile below gap moves up
		ArrowDown: { row: gapRow - 1, col: gapCol }, // Tile above gap moves down
		ArrowLeft: { row: gapRow, col: gapCol + 1 }, // Tile right of gap moves left
		ArrowRight: { row: gapRow, col: gapCol - 1 }, // Tile left of gap moves right
	};

	const target = directionMap[direction];
	if (!target) return null;

	// Check bounds
	if (
		target.row < 0 ||
		target.row >= size ||
		target.col < 0 ||
		target.col >= size
	) {
		return null;
	}

	return target.row * size + target.col;
}

// ===== Main Component =====

function Board({ size, onWin, showNumbers }) {
	// ===== State & Effects =====
	const [tiles, setTiles] = useState(() => scramblePuzzle(size));
	const [isWon, setIsWon] = useState(false);
	const tileRefs = useRef({});
	const animationQueue = useRef(null);

	// Reset board when size changes
	useEffect(() => {
		setTiles(scramblePuzzle(size));
		setIsWon(false);
	}, [size]);

	// FLIP animation using useLayoutEffect (fires BEFORE browser paints)
	useLayoutEffect(() => {
		if (!animationQueue.current) return;

		const { gapIndex, deltaX, deltaY } = animationQueue.current;

		console.log("🎬 ANIMATION START:");
		console.log(`  Will invert by: translate(${-deltaX}px, ${-deltaY}px)`);

		// The tile is now at the gap position in the DOM
		const movedTile = tileRefs.current[gapIndex];

		if (movedTile) {
			const beforeRect = movedTile.getBoundingClientRect();
			console.log(
				`  ⏮️  BEFORE invert: left=${beforeRect.left.toFixed(2)}, top=${beforeRect.top.toFixed(2)}`,
			);

			// Invert: Move tile back to starting position (no transition)
			movedTile.style.transition = "none";
			movedTile.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

			// Force reflow to apply transform before animation
			movedTile.offsetHeight;

			const afterInvertRect = movedTile.getBoundingClientRect();
			console.log(
				`  ↩️  AFTER invert: left=${afterInvertRect.left.toFixed(2)}, top=${afterInvertRect.top.toFixed(2)}`,
			);

			// Play: Use RAF to start animation on next frame
			requestAnimationFrame(() => {
				movedTile.style.transition = "transform 0.3s linear";
				movedTile.style.transform = "translate(0, 0)";

				console.log(`  ▶️  ANIMATING to translate(0, 0)`);

				// Clean up after animation
				setTimeout(() => {
					movedTile.style.transition = "";
					movedTile.style.transform = "";
					const finalRect = movedTile.getBoundingClientRect();
					console.log(
						`  ✅ FINAL: left=${finalRect.left.toFixed(2)}, top=${finalRect.top.toFixed(2)}`,
					);
					console.log("─".repeat(60));
				}, 300);
			});
		}

		// Clear the queue
		animationQueue.current = null;
	}, [tiles]); // Re-run when tiles change

	// ===== Derived Values =====
	const gapIndex = getGapIndex(tiles);
	
	// Responsive sizing - fit mobile screens
	const getResponsiveBoardSize = () => {
		const maxSize = Math.min(window.innerWidth - 40, 480); // 20px margin each side
		return maxSize;
	};
	
	const [boardSizePx, setBoardSizePx] = useState(getResponsiveBoardSize());
	const tileSizePx = boardSizePx / size;

	// Update board size on resize
	useEffect(() => {
		const handleResize = () => {
			setBoardSizePx(getResponsiveBoardSize());
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Show win dialog
	useEffect(() => {
		if (isWon && onWin) {
			onWin();
		}
	}, [isWon, onWin]);

	// ===== Movement Logic =====
	const moveTile = useCallback(
		(tileIndex) => {
			if (isWon) return;
			if (tiles[tileIndex] === null) return;

			const gapIndex = getGapIndex(tiles);
			if (!isAdjacent(gapIndex, tileIndex, size)) return;

			const tileElement = tileRefs.current[tileIndex];
			const gapElement = tileRefs.current[gapIndex];
			const newTiles = swapTiles(tiles, tileIndex, gapIndex);

			// Check for win
			if (checkWin(newTiles, getSolvedState(size))) {
				setTiles(newTiles);
				setIsWon(true);
				return; // No animation on win
			}

			// Animate if we have refs, otherwise just update state
			if (tileElement && gapElement) {
				const { deltaX, deltaY } = captureTilePositions(
					tileElement,
					gapElement,
				);

				// Queue animation data for useLayoutEffect
				animationQueue.current = {
					tileIndex,
					gapIndex,
					deltaX,
					deltaY,
				};

				// Update state (will trigger useLayoutEffect)
				setTiles(newTiles);
			} else {
				setTiles(newTiles);
			}
		},
		[tiles, isWon, size],
	);

	const handleKeyPress = useCallback(
		(event) => {
			const arrowKeys = [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
			];
			if (!arrowKeys.includes(event.key)) return;

			event.preventDefault(); // Prevent page scrolling

			const gapIndex = getGapIndex(tiles);
			const tileIndex = getTileIndexFromDirection(
				gapIndex,
				event.key,
				size,
			);

			if (tileIndex !== null) {
				moveTile(tileIndex);
			}
		},
		[tiles, size, moveTile],
	);

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		moveTile(index);
	};

	// Keyboard controls
	useEffect(() => {
		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, [handleKeyPress]);

	const handleSolve = () => {
		setTiles(getSolvedState(size));
		setIsWon(true);
	};

	// ===== Render =====
	return (
		<>
			<div
				className="board"
				style={{
					width: `${boardSizePx}px`,
					height: `${boardSizePx}px`,
					display: "grid",
					gridTemplateColumns: `repeat(${size}, 1fr)`,
					gridTemplateRows: `repeat(${size}, 1fr)`,
					gap: "0px",
				}}
			>
				{tiles.slice(0, size * size).map((value, index) => (
					<Tile
						key={index}
						ref={(el) => (tileRefs.current[index] = el)}
						value={value}
						isGap={value === null}
						isAdjacentToGap={
							gapIndex >= 0 && isAdjacent(index, gapIndex, size)
						}
						onClick={() => handleTileClick(index)}
						showNumbers={showNumbers}
					/>
				))}
			</div>
			<SolveButton onClick={handleSolve} />
		</>
	);
}

// ===== Sub-components =====

function SolveButton({ onClick }) {
	return (
		<button
			onClick={onClick}
			style={{
				marginTop: "20px",
				padding: "10px 20px",
				fontSize: "1rem",
				cursor: "pointer",
				backgroundColor: "#10b981",
				color: "white",
				border: "none",
				borderRadius: "6px",
			}}
		>
			🔧 Solve (Testing)
		</button>
	);
}

export default Board;
