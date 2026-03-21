#!/usr/bin/env python3
"""Simplify mockData.js to remove difficulty nesting (3x3 only)"""

import re

with open('src/dev/mockData.js', 'r') as f:
    content = f.read()

# Update getMockPuzzle to only return 3x3 grid
old_get_mock = """export function getMockPuzzle(puzzleId) {
\treturn {
\t\tid: puzzleId,
\t\tdate: "2026-03-03",
\t\temoji: "🛝", // Playground slide (today's emoji)
\t\temojiName: "Playground Slide",
\t\tinitialGrid3x3: scramblePuzzle(3),
\t\tinitialGrid4x4: scramblePuzzle(4),
\t};
}"""

new_get_mock = """export function getMockPuzzle(puzzleId) {
\treturn {
\t\tid: puzzleId,
\t\tdate: "2026-03-03",
\t\temoji: "🛝", // Playground slide (today's emoji)
\t\temojiName: "Playground Slide",
\t\tinitialGrid: scramblePuzzle(3), // 3x3 only
\t};
}"""

content = content.replace(old_get_mock, new_get_mock)

# Simplify activePlayer solvedPuzzles - remove nested structure
old_active = """\t\tsolvedPuzzles: {
\t\t\t// Solved puzzles 1-10 on both difficulties
\t\t\t...Object.fromEntries(
\t\t\t\tArray.from({ length: 10 }, (_, i) => {
\t\t\t\t\tconst puzzleId = i + 1;
\t\t\t\t\tconst emojiData = getMockEmoji(puzzleId);
\t\t\t\t\treturn [
\t\t\t\t\t\tpuzzleId,
\t\t\t\t\t\t{
\t\t\t\t\t\t\t3: {
\t\t\t\t\t\t\t\tmoves: 30 + Math.floor(Math.random() * 20),
\t\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date("2026-02-20"),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date("2026-02-20"),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t\t120 + Math.floor(Math.random() * 60),
\t\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t\t},
\t\t\t\t\t\t\t4: {
\t\t\t\t\t\t\t\tmoves: 50 + Math.floor(Math.random() * 30),
\t\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date("2026-02-21"),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date("2026-02-21"),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t\t180 + Math.floor(Math.random() * 90),
\t\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t\t},
\t\t\t\t\t\t},
\t\t\t\t\t];
\t\t\t\t}),
\t\t\t),
\t\t},"""

new_active = """\t\tsolvedPuzzles: {
\t\t\t// Solved puzzles 1-10 (3x3 only)
\t\t\t...Object.fromEntries(
\t\t\t\tArray.from({ length: 10 }, (_, i) => {
\t\t\t\t\tconst puzzleId = i + 1;
\t\t\t\t\tconst emojiData = getMockEmoji(puzzleId);
\t\t\t\t\treturn [
\t\t\t\t\t\tpuzzleId,
\t\t\t\t\t\t{
\t\t\t\t\t\t\tmoves: 30 + Math.floor(Math.random() * 20),
\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\tnew Date("2026-02-20"),
\t\t\t\t\t\t\t),
\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\tnew Date("2026-02-20"),
\t\t\t\t\t\t\t),
\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t120 + Math.floor(Math.random() * 60),
\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t},
\t\t\t\t\t];
\t\t\t\t}),
\t\t\t),
\t\t},"""

content = content.replace(old_active, new_active)

# Simplify resumePlayer solvedPuzzles
old_resume_solved = """\t\tsolvedPuzzles: {
\t\t\t1: {
\t\t\t\t3: {
\t\t\t\t\tmoves: 42,
\t\t\t\t\tcompletedAt: Timestamp.fromDate(new Date("2026-03-01")),
\t\t\t\t\tstartedAt: Timestamp.fromDate(new Date("2026-03-01")),
\t\t\t\t\ttimeSpent: 125,
\t\t\t\t\tfromArchive: false,
\t\t\t\t\temoji: getMockEmoji(1).emoji,
\t\t\t\t\temojiName: getMockEmoji(1).name,
\t\t\t\t},
\t\t\t},
\t\t},"""

new_resume_solved = """\t\tsolvedPuzzles: {
\t\t\t1: {
\t\t\t\tmoves: 42,
\t\t\t\tcompletedAt: Timestamp.fromDate(new Date("2026-03-01")),
\t\t\t\tstartedAt: Timestamp.fromDate(new Date("2026-03-01")),
\t\t\t\ttimeSpent: 125,
\t\t\t\tfromArchive: false,
\t\t\t\temoji: getMockEmoji(1).emoji,
\t\t\t\temojiName: getMockEmoji(1).name,
\t\t\t},
\t\t},"""

content = content.replace(old_resume_solved, new_resume_solved)

# Simplify resumePlayer gameState
old_resume_game = """\tgameState: {
\t\t\t63: {
\t\t\t\t// Today's puzzle
\t\t\t\t3: {
\t\t\t\t\tmoves: 15,
\t\t\t\t\tboard: scramblePuzzle(3),
\t\t\t\t\tstartedAt: Timestamp.now(),
\t\t\t\t\tfromArchive: false,
\t\t\t\t},
\t\t\t},
\t\t},"""

new_resume_game = """\tgameState: {
\t\t\t63: {
\t\t\t\t// Today's puzzle (3x3)
\t\t\t\tmoves: 15,
\t\t\t\tboard: scramblePuzzle(3),
\t\t\t\tstartedAt: Timestamp.now(),
\t\t\t\tfromArchive: false,
\t\t\t},
\t\t},"""

content = content.replace(old_resume_game, new_resume_game)

# Simplify powerUser solvedPuzzles
old_power = """\t\tsolvedPuzzles: {
\t\t\t// Solved 30 puzzles
\t\t\t...Object.fromEntries(
\t\t\t\tArray.from({ length: 30 }, (_, i) => {
\t\t\t\t\tconst puzzleId = i + 1;
\t\t\t\t\tconst emojiData = getMockEmoji(puzzleId);
\t\t\t\t\treturn [
\t\t\t\t\t\tpuzzleId,
\t\t\t\t\t\t{
\t\t\t\t\t\t\t3: {
\t\t\t\t\t\t\t\tmoves: 25 + Math.floor(Math.random() * 15),
\t\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t\t90 + Math.floor(Math.random() * 30),
\t\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t\t},
\t\t\t\t\t\t\t4: {
\t\t\t\t\t\t\t\tmoves: 45 + Math.floor(Math.random() * 25),
\t\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t\t150 + Math.floor(Math.random() * 60),
\t\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t\t},
\t\t\t\t\t\t},
\t\t\t\t\t];
\t\t\t\t}),
\t\t\t),
\t\t},"""

new_power = """\t\tsolvedPuzzles: {
\t\t\t// Solved 30 puzzles (3x3 only)
\t\t\t...Object.fromEntries(
\t\t\t\tArray.from({ length: 30 }, (_, i) => {
\t\t\t\t\tconst puzzleId = i + 1;
\t\t\t\t\tconst emojiData = getMockEmoji(puzzleId);
\t\t\t\t\treturn [
\t\t\t\t\t\tpuzzleId,
\t\t\t\t\t\t{
\t\t\t\t\t\t\tmoves: 25 + Math.floor(Math.random() * 15),
\t\t\t\t\t\t\tcompletedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t),
\t\t\t\t\t\t\tstartedAt: Timestamp.fromDate(
\t\t\t\t\t\t\t\tnew Date(`2026-02-${(i % 28) + 1}`),
\t\t\t\t\t\t\t),
\t\t\t\t\t\t\ttimeSpent:
\t\t\t\t\t\t\t\t90 + Math.floor(Math.random() * 30),
\t\t\t\t\t\t\tfromArchive: false,
\t\t\t\t\t\t\temoji: emojiData.emoji,
\t\t\t\t\t\t\temojiName: emojiData.name,
\t\t\t\t\t\t},
\t\t\t\t\t];
\t\t\t\t}),
\t\t\t),
\t\t},"""

content = content.replace(old_power, new_power)

with open('src/dev/mockData.js', 'w') as f:
    f.write(content)

print("✓ Simplified mockData.js - flattened all mock user scenarios")
