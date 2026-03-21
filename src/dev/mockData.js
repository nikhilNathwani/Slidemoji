/**
 * Mock data for development and testing
 *
 * This file provides realistic data for testing different user states
 * without needing a full Firestore database.
 *
 * Enable dev mode by setting: VITE_DEV_MODE=true in .env.local
 */

import { Timestamp } from "firebase/firestore";
import { scramblePuzzle } from "../utils/gridHelpers";

// Check if dev mode is enabled
export const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

/**
 * Mock puzzle data (matches Firestore schema)
 * Returns a puzzle with scrambled 3x3 and 4x4 grids
 */
export function getMockPuzzle(puzzleId) {
	return {
		id: puzzleId,
		date: "2026-03-03",
		emoji: "🛝", // Playground slide (today's emoji)
		emojiName: "Playground Slide",
		initialGrid: scramblePuzzle(3), // 3x3 only
	};
}

/**
 * Get mock emoji for a puzzle ID (for mock completedPuzzles data)
 */
function getMockEmoji(puzzleId) {
	const emojis = [
		{ emoji: "🎯", name: "Direct Hit" },
		{ emoji: "🎨", name: "Artist Palette" },
		{ emoji: "🎭", name: "Performing Arts" },
		{ emoji: "🎪", name: "Circus Tent" },
		{ emoji: "🎸", name: "Guitar" },
		{ emoji: "🎹", name: "Musical Keyboard" },
		{ emoji: "🎺", name: "Trumpet" },
		{ emoji: "🎻", name: "Violin" },
		{ emoji: "🎮", name: "Video Game" },
		{ emoji: "🎲", name: "Game Die" },
		{ emoji: "🎰", name: "Slot Machine" },
		{ emoji: "🎳", name: "Bowling" },
		{ emoji: "🏀", name: "Basketball" },
		{ emoji: "⚽", name: "Soccer Ball" },
		{ emoji: "🏈", name: "Football" },
		{ emoji: "⚾", name: "Baseball" },
		{ emoji: "🎾", name: "Tennis" },
		{ emoji: "🏐", name: "Volleyball" },
		{ emoji: "🏉", name: "Rugby" },
		{ emoji: "🎱", name: "Pool 8 Ball" },
		{ emoji: "🏓", name: "Ping Pong" },
		{ emoji: "🏸", name: "Badminton" },
		{ emoji: "🏒", name: "Ice Hockey" },
		{ emoji: "🏑", name: "Field Hockey" },
		{ emoji: "🥏", name: "Flying Disc" },
		{ emoji: "🎿", name: "Skis" },
		{ emoji: "🛷", name: "Sled" },
		{ emoji: "⛸️", name: "Ice Skate" },
		{ emoji: "🥌", name: "Curling Stone" },
		{ emoji: "🎯", name: "Bullseye" },
	];
	return emojis[(puzzleId - 1) % emojis.length];
}

/**
 * Mock user data scenarios for testing different states
 */
export const mockUserScenarios = {
	// Brand new user - no trophies, no streaks
	newUser: {
		uid: "dev-user-new",
		email: "new@example.com",
		displayName: "New User",
		preferences: {
			darkMode: false,
		},
		stats: {
			totalAttempted: 0,
			totalSolved: 0,
			solvedPuzzles: {},
		},
		gameState: null,
	},

	// User with active play streak
	activePlayer: {
		uid: "dev-user-active",
		email: "active@example.com",
		displayName: "Active Player",
		preferences: {
			darkMode: true,
		},
		stats: {
			totalAttempted: 15,
			totalSolved: 12,
			solvedPuzzles: {
				// Solved puzzles 1-10 on both difficulties
				...Object.fromEntries(
					Array.from({ length: 10 }, (_, i) => {
						const puzzleId = i + 1;
						const emojiData = getMockEmoji(puzzleId);
						return [
							puzzleId,
							{
								3: {
									moves: 30 + Math.floor(Math.random() * 20),
									completedAt: Timestamp.fromDate(
										new Date("2026-02-20"),
									),
									startedAt: Timestamp.fromDate(
										new Date("2026-02-20"),
									),
									timeSpent:
										120 + Math.floor(Math.random() * 60),
									fromArchive: false,
									emoji: emojiData.emoji,
									emojiName: emojiData.name,
								},
								4: {
									moves: 50 + Math.floor(Math.random() * 30),
									completedAt: Timestamp.fromDate(
										new Date("2026-02-21"),
									),
									startedAt: Timestamp.fromDate(
										new Date("2026-02-21"),
									),
									timeSpent:
										180 + Math.floor(Math.random() * 90),
									fromArchive: false,
									emoji: emojiData.emoji,
									emojiName: emojiData.name,
								},
							},
						];
					}),
				),
			},
		},
		gameState: null,
	},

	// User with saved game in progress
	resumePlayer: {
		uid: "dev-user-resume",
		email: "resume@example.com",
		displayName: "Resume Player",
		preferences: {
			darkMode: false,
		},
		stats: {
			totalAttempted: 5,
			totalSolved: 3,
			solvedPuzzles: {
				1: {
					3: {
						moves: 42,
						completedAt: Timestamp.fromDate(new Date("2026-03-01")),
						startedAt: Timestamp.fromDate(new Date("2026-03-01")),
						timeSpent: 125,
						fromArchive: false,
						emoji: getMockEmoji(1).emoji,
						emojiName: getMockEmoji(1).name,
					},
				},
			},
		},
		gameState: {
			63: {
				// Today's puzzle (3x3)
				moves: 15,
				board: scramblePuzzle(3),
				startedAt: Timestamp.now(),
				fromArchive: false,
			},
		},
	},

	// Power user with many trophies
	powerUser: {
		uid: "dev-user-power",
		email: "power@example.com",
		displayName: "Power User",
		preferences: {
			darkMode: true,
		},
		stats: {
			totalAttempted: 50,
			totalSolved: 45,
			solvedPuzzles: {
				// Solved 30 puzzles
				...Object.fromEntries(
					Array.from({ length: 30 }, (_, i) => {
						const puzzleId = i + 1;
						const emojiData = getMockEmoji(puzzleId);
						return [
							puzzleId,
							{
								3: {
									moves: 25 + Math.floor(Math.random() * 15),
									completedAt: Timestamp.fromDate(
										new Date(`2026-02-${(i % 28) + 1}`),
									),
									startedAt: Timestamp.fromDate(
										new Date(`2026-02-${(i % 28) + 1}`),
									),
									timeSpent:
										90 + Math.floor(Math.random() * 30),
									fromArchive: false,
									emoji: emojiData.emoji,
									emojiName: emojiData.name,
								},
								4: {
									moves: 45 + Math.floor(Math.random() * 25),
									completedAt: Timestamp.fromDate(
										new Date(`2026-02-${(i % 28) + 1}`),
									),
									startedAt: Timestamp.fromDate(
										new Date(`2026-02-${(i % 28) + 1}`),
									),
									timeSpent:
										150 + Math.floor(Math.random() * 60),
									fromArchive: false,
									emoji: emojiData.emoji,
									emojiName: emojiData.name,
								},
							},
						];
					}),
				),
			},
		},
		gameState: null,
	},
};

/**
 * Get mock user data based on scenario
 * @param {string} scenario - One of: 'newUser', 'activePlayer', 'resumePlayer', 'powerUser'
 * @returns {Object} Mock user data
 */
export function getMockUser(scenario = "newUser") {
	return mockUserScenarios[scenario] || mockUserScenarios.newUser;
}

/**
 * Dev mode configuration
 * Control this via localStorage in browser console:
 *
 * localStorage.setItem('devMode', 'true')
 * localStorage.setItem('devUserScenario', 'powerUser')
 */
export function getDevConfig() {
	if (typeof window === "undefined") return { enabled: false };

	return {
		enabled: isDevMode || localStorage.getItem("devMode") === "true",
		userScenario: localStorage.getItem("devUserScenario") || "newUser",
		showDevPanel: localStorage.getItem("devShowPanel") === "true",
	};
}

/**
 * Dev tools helper - log to console
 */
export function devLog(message, data) {
	if (getDevConfig().enabled) {
		console.log(`[DEV] ${message}`, data || "");
	}
}
