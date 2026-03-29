import { describe, expect, it } from "vitest";

import { areGridsEqual, chooseGridForMerge } from "./gridHelpers";

describe("areGridsEqual", () => {
	it("returns true for identical grids", () => {
		expect(areGridsEqual([1, 2, 3, 0], [1, 2, 3, 0])).toBe(true);
	});

	it("returns false for different grids", () => {
		expect(areGridsEqual([1, 2, 3, 0], [1, 2, 0, 3])).toBe(false);
	});

	it("returns false for non-arrays", () => {
		expect(areGridsEqual(null, [1, 2, 3, 0])).toBe(false);
		expect(areGridsEqual([1, 2, 3, 0], undefined)).toBe(false);
	});
});

describe("chooseGridForMerge", () => {
	const initialGrid = [1, 2, 0, 3];
	const anonymousSolved = [1, 2, 3, 0];
	const anonymousInProgress = [1, 0, 2, 3];
	const googleSolved = [1, 2, 3, 0];
	const googleInProgress = [0, 1, 2, 3];

	it("keeps anonymous grid when anonymous is solved", () => {
		expect(
			chooseGridForMerge(anonymousSolved, googleInProgress, initialGrid),
		).toEqual(anonymousSolved);
	});

	it("uses google grid when anonymous is still initial", () => {
		expect(
			chooseGridForMerge(initialGrid, googleInProgress, initialGrid),
		).toEqual(googleInProgress);
	});

	it("keeps anonymous grid when anonymous is in progress and google is initial", () => {
		expect(
			chooseGridForMerge(anonymousInProgress, initialGrid, initialGrid),
		).toEqual(anonymousInProgress);
	});

	it("uses google grid when both are progressed and anonymous is not solved", () => {
		expect(
			chooseGridForMerge(anonymousInProgress, googleSolved, initialGrid),
		).toEqual(googleSolved);
	});
});
