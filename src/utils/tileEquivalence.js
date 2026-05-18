import { createEmojiSvgUrl } from "./emoji";

const CANVAS_SIZE = 512;

// OS font renderers always anti-alias emoji glyphs — we can't disable this.
// Edge pixels from anti-aliasing have alpha values of roughly 1–15.
// Real emoji content always renders at alpha >= 16, so this cutoff reliably
// separates "blank tile with anti-aliased border bleed" from "tile with content."
const MIN_CONTENT_ALPHA = 16;

// A tile is considered blank if fewer than this fraction of its pixels have
// alpha >= MIN_CONTENT_ALPHA. Tiny edge fragments (e.g. a sliver of the emoji
// bleeding into a corner tile) are below this threshold and treated as blank;
// tiles with meaningful emoji content are well above it.
const BLANK_CONTENT_FRACTION = 0.03;

/**
 * Returns true if two Uint8ClampedArrays are pixel-identical.
 * Since both tiles are extracted from the same canvas render, this is exact and reliable.
 */
function pixelsEqual(dataA, dataB) {
	if (dataA.length !== dataB.length) return false;
	for (let i = 0; i < dataA.length; i++) {
		if (dataA[i] !== dataB[i]) return false;
	}
	return true;
}

/**
 * Returns true if a tile has no meaningful emoji content.
 * A tile is blank when fewer than BLANK_CONTENT_FRACTION of its pixels have
 * alpha >= MIN_CONTENT_ALPHA. This handles both fully-empty tiles and tiles
 * that contain only a tiny edge fragment that is too small to be identifiable.
 */
function isBlankTile(pixelData) {
	const totalPixels = pixelData.length / 4;
	let contentPixels = 0;
	for (let i = 3; i < pixelData.length; i += 4) {
		if (pixelData[i] >= MIN_CONTENT_ALPHA) contentPixels++;
	}
	return contentPixels / totalPixels < BLANK_CONTENT_FRACTION;
}

// Module-level cache: "emoji:gridSize" → Promise<{ ambiguous, canonical }>
// Avoids re-rendering the same emoji to canvas more than once per session.
const analysisCache = new Map();

/**
 * Core analysis: renders the emoji once and returns:
 *   ambiguous — Set of tile numbers that need a label (blank or duplicate)
 *   canonical — Map<tileNumber, groupRepresentative> for fuzzy win checking
 *
 * Equivalence groups:
 *   - All blank tiles form one group (any tile with no visible content)
 *   - Pixel-identical non-blank tiles form their own groups
 *   - Each group's representative is its minimum tile number
 */
function analyzeEmoji(emoji, gridSize) {
	const key = `${emoji}:${gridSize}`;
	if (analysisCache.has(key)) return analysisCache.get(key);

	const promise = new Promise((resolve) => {
		const img = new Image();

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = CANVAS_SIZE;
				canvas.height = CANVAS_SIZE;
				const ctx = canvas.getContext("2d", {
					willReadFrequently: true,
				});
				ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

				const tilePixelSize = Math.round(CANVAS_SIZE / gridSize);
				const totalTiles = gridSize * gridSize;
				const pixelData = new Map();

				for (let row = 0; row < gridSize; row++) {
					for (let col = 0; col < gridSize; col++) {
						const tileNum = row * gridSize + col + 1;
						if (tileNum === totalTiles) continue; // skip gap tile position
						const imageData = ctx.getImageData(
							Math.round(col * tilePixelSize),
							Math.round(row * tilePixelSize),
							tilePixelSize,
							tilePixelSize,
						);
						pixelData.set(tileNum, imageData.data);
					}
				}

				const ambiguous = new Set();
				// Each tile starts as its own canonical representative
				const canonical = new Map(
					[...pixelData.keys()].map((n) => [n, n]),
				);

				// --- Blank tiles: grouped with the gap (canonical 0) ---
				// The gap is always visually blank (it's the empty hole), so blank
				// tiles and the gap are always interchangeable for win purposes.
				for (const [tileNum, data] of pixelData) {
					if (isBlankTile(data)) {
						canonical.set(tileNum, 0);
						ambiguous.add(tileNum);
					}
				}

				// --- Non-blank duplicates: grouped under minimum tile number ---
				const nonBlank = [...pixelData.keys()].filter(
					(n) => !isBlankTile(pixelData.get(n)),
				);
				for (let i = 0; i < nonBlank.length; i++) {
					for (let j = i + 1; j < nonBlank.length; j++) {
						const a = nonBlank[i];
						const b = nonBlank[j];
						if (pixelsEqual(pixelData.get(a), pixelData.get(b))) {
							ambiguous.add(a);
							ambiguous.add(b);
							// Merge the two groups under the lower canonical
							const ca = canonical.get(a);
							const cb = canonical.get(b);
							if (ca !== cb) {
								const keep = Math.min(ca, cb);
								const drop = Math.max(ca, cb);
								for (const [t, c] of canonical) {
									if (c === drop) canonical.set(t, keep);
								}
							}
						}
					}
				}

				resolve({ ambiguous, canonical });
			} catch {
				resolve({ ambiguous: new Set(), canonical: new Map() });
			}
		};

		img.onerror = () =>
			resolve({ ambiguous: new Set(), canonical: new Map() });
		img.src = createEmojiSvgUrl(emoji); // raw emoji, no gradient
	});

	analysisCache.set(key, promise);
	return promise;
}

/**
 * Returns a Promise<Set<number>> of tile numbers that should show a label
 * when the user has numbers turned OFF (blank or visually duplicate tiles).
 */
export function detectAmbiguousTiles(emoji, gridSize) {
	return analyzeEmoji(emoji, gridSize).then(({ ambiguous }) => ambiguous);
}

/**
 * Returns a Promise<Map<number, number>> mapping each tile number to its
 * equivalence group's representative (minimum tile number in the group).
 * Used by checkWin to allow interchangeable tiles in the solved state.
 */
export function detectEquivalenceGroups(emoji, gridSize) {
	return analyzeEmoji(emoji, gridSize).then(({ canonical }) => canonical);
}
