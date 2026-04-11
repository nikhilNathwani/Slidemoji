#!/usr/bin/env node
/**
 * generateEmojiReviewCsv.js
 *
 * Produces data/emoji_review.csv — all 1096 calendar emojis sorted by Unicode group
 * with an empty "exclude" column for manual review.
 *
 * After review, run parseEmojiReviewCsv.js to split into include/exclude lists.
 *
 * Usage: node scripts/generateEmojiReviewCsv.js
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const emojiData = require("unicode-emoji-json");
const calendar = require("../data/emoji_calendar.json");

// Strip variation selectors for lookup
function normalizeEmoji(e) {
	return e.replace(/\uFE0F/g, "").replace(/\uFE0E/g, "");
}

const groupOrder = [
	"Smileys & Emotion",
	"People & Body",
	"Animals & Nature",
	"Food & Drink",
	"Travel & Places",
	"Activities",
	"Objects",
	"Symbols",
	"Flags",
];

// Build canonical index map from unicode-emoji-json's insertion order (matches Unicode spec)
const emojiDataKeys = Object.keys(emojiData);
const canonicalIndex = (emoji) => {
	const i = emojiDataKeys.indexOf(emoji);
	const j = emojiDataKeys.indexOf(normalizeEmoji(emoji));
	const idx = i !== -1 ? i : j;
	return idx === -1 ? 99999 : idx;
};

const rows = [];
let notFound = 0;

for (const entry of calendar) {
	const emoji = entry.emoji;
	const info = emojiData[emoji] || emojiData[normalizeEmoji(emoji)];
	const group = info ? info.group : "Unknown";
	const name = entry.name || entry.emojiName || (info ? info.name : "");
	rows.push({ emoji, name, group });
	if (!info) notFound++;
}

// Add all flag emojis from unicode-emoji-json not already in the calendar
const calendarEmojiSet = new Set(
	rows.flatMap((r) => [r.emoji, normalizeEmoji(r.emoji)]),
);
for (const [emoji, info] of Object.entries(emojiData)) {
	if (info.group !== "Flags") continue;
	if (
		calendarEmojiSet.has(emoji) ||
		calendarEmojiSet.has(normalizeEmoji(emoji))
	)
		continue;
	rows.push({ emoji, name: info.name, group: "Flags" });
}

rows.sort((a, b) => {
	const ai = groupOrder.indexOf(a.group);
	const bi = groupOrder.indexOf(b.group);
	const ao = ai === -1 ? 99 : ai;
	const bo = bi === -1 ? 99 : bi;
	if (ao !== bo) return ao - bo;
	// Within group, use canonical Unicode order from unicode-emoji-json
	return canonicalIndex(a.emoji) - canonicalIndex(b.emoji);
});

const lines = ["emoji,name,group,exclude"];
for (const r of rows) {
	const safeName = r.name.includes(",") ? `"${r.name}"` : r.name;
	lines.push(`${r.emoji},${safeName},${r.group},`);
}

const outPath = join(__dirname, "../data/emoji_review.csv");
writeFileSync(outPath, lines.join("\n") + "\n");
console.log(`Written ${rows.length} rows to ${outPath}`);
if (notFound > 0) {
	console.warn(
		`${notFound} emojis not found in unicode-emoji-json (marked Unknown)`,
	);
}

// Print group breakdown
const counts = {};
for (const r of rows) counts[r.group] = (counts[r.group] || 0) + 1;
console.log("\nGroup breakdown:");
for (const [g, n] of Object.entries(counts)) {
	console.log(`  ${g}: ${n}`);
}
