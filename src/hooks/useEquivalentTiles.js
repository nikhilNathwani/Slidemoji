import { useState, useEffect, useMemo } from "react";
import {
	detectAmbiguousTiles,
	detectEquivalenceGroups,
} from "../utils/tileEquivalence";
import { checkWin } from "../utils/gridHelpers";

/**
 * Returns the Set of tile numbers (1-based) that should always show their
 * number label when the user has numbers turned OFF — tiles that are either
 * visually blank or pixel-identical to another tile.
 *
 * Runs async canvas detection once per [emoji, gridSize] combination.
 */
export function useAmbiguousTiles(emoji, gridSize) {
	const [ambiguousTiles, setAmbiguousTiles] = useState(new Set());

	useEffect(() => {
		if (!emoji) {
			return;
		}
		let cancelled = false;
		detectAmbiguousTiles(emoji, gridSize).then((result) => {
			if (!cancelled) setAmbiguousTiles(result);
		});
		return () => {
			cancelled = true;
		};
	}, [emoji, gridSize]);

	return emoji ? ambiguousTiles : new Set();
}

/**
 * Returns a Map<tileNumber, canonicalRepresentative> for use with checkWin.
 * Tiles in the same equivalence group share the same canonical (minimum tile
 * number in the group). Starts as an empty Map until the canvas analysis completes.
 */
export function useCanonicalMap(emoji, gridSize) {
	const [canonicalMap, setCanonicalMap] = useState(new Map());

	useEffect(() => {
		if (!emoji) {
			return;
		}
		let cancelled = false;
		detectEquivalenceGroups(emoji, gridSize).then((result) => {
			if (!cancelled) setCanonicalMap(result);
		});
		return () => {
			cancelled = true;
		};
	}, [emoji, gridSize]);

	return emoji ? canonicalMap : new Map();
}

/**
 * Returns a boolean indicating whether the current grid is solved, using
 * fuzzy equivalence if canvas analysis has completed, or strict win otherwise.
 * Hides the canonicalMap implementation detail from callers.
 */
export function useIsSolved(grid, emoji) {
	const gridSize = useMemo(
		() => Math.floor(Math.sqrt(grid?.length || 9)),
		[grid?.length],
	);
	const canonicalMap = useCanonicalMap(emoji, gridSize);
	return checkWin(grid, canonicalMap);
}
