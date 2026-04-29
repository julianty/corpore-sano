import {
  normalizeExerciseKey,
  getCurrentWeekMonday,
  computeStats,
  mergeLifts,
} from "./exerciseHistory";
import type { Lift } from "./exerciseHistory";

// --- normalizeExerciseKey ---

describe("normalizeExerciseKey", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(normalizeExerciseKey("Bench Press")).toBe("bench-press");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeExerciseKey("  Overhead Press  ")).toBe("overhead-press");
  });

  it("strips parentheses and other non-alphanumeric chars", () => {
    expect(normalizeExerciseKey("Dumbbell Row (Single Arm)")).toBe(
      "dumbbell-row-single-arm",
    );
  });

  it("collapses consecutive non-alphanumeric chars into a single hyphen", () => {
    expect(normalizeExerciseKey("Push  --  Up")).toBe("push-up");
  });

  it("handles already-lowercase input", () => {
    expect(normalizeExerciseKey("squat")).toBe("squat");
  });
});

// --- getCurrentWeekMonday ---

describe("getCurrentWeekMonday", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    expect(getCurrentWeekMonday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a Monday", () => {
    // Append local-time suffix so Date parsing doesn't shift the date via UTC offset
    const monday = new Date(getCurrentWeekMonday() + "T00:00:00");
    expect(monday.getDay()).toBe(1);
  });

  it("returns a date no more than 6 days before today", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(getCurrentWeekMonday());
    const diffDays = Math.round(
      (today.getTime() - monday.getTime()) / 86400000,
    );
    expect(diffDays).toBeGreaterThanOrEqual(0);
    expect(diffDays).toBeLessThanOrEqual(6);
  });
});

// --- computeStats ---

const MONDAY = "2026-04-27";
const THIS_WEEK: Lift[] = [
  { weight: 100, reps: 5, date: "2026-04-27" },
  { weight: 110, reps: 5, date: "2026-04-28" },
  { weight: 120, reps: 3, date: "2026-04-28" },
];
const LAST_WEEK: Lift[] = [
  { weight: 90, reps: 8, date: "2026-04-20" },
  { weight: 95, reps: 8, date: "2026-04-21" },
];

describe("computeStats", () => {
  it("computes max, min, and median correctly", () => {
    const stats = computeStats([...LAST_WEEK, ...THIS_WEEK], MONDAY);
    expect(stats.maxWeight).toBe(120);
    expect(stats.minWeight).toBe(90);
    expect(stats.medianWeight).toBe(100); // sorted: [90, 95, 100, 110, 120] → middle is 100
  });

  it("counts only this-week sets for setsThisWeek", () => {
    const stats = computeStats([...LAST_WEEK, ...THIS_WEEK], MONDAY);
    expect(stats.setsThisWeek).toBe(3);
  });

  it("returns setsWeekOf equal to the supplied monday", () => {
    const stats = computeStats(THIS_WEEK, MONDAY);
    expect(stats.setsWeekOf).toBe(MONDAY);
  });

  it("handles empty lifts gracefully", () => {
    const stats = computeStats([], MONDAY);
    expect(stats.maxWeight).toBe(0);
    expect(stats.minWeight).toBe(0);
    expect(stats.medianWeight).toBe(0);
    expect(stats.setsThisWeek).toBe(0);
  });

  it("computes median for an even-length array as the average of two middle values", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-27" },
      { weight: 200, reps: 5, date: "2026-04-27" },
    ];
    const stats = computeStats(lifts, MONDAY);
    expect(stats.medianWeight).toBe(150);
  });
});

// --- mergeLifts ---

const TODAY = "2026-04-28";

describe("mergeLifts", () => {
  it("preserves past lifts and appends session lifts for today", () => {
    const stored: Lift[] = [{ weight: 90, reps: 8, date: "2026-04-20" }];
    const session: Lift[] = [{ weight: 100, reps: 5, date: TODAY }];
    const merged = mergeLifts(stored, session, TODAY);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual({ weight: 90, reps: 8, date: "2026-04-20" });
    expect(merged).toContainEqual({ weight: 100, reps: 5, date: TODAY });
  });

  it("replaces stored lifts from today rather than duplicating them", () => {
    const stored: Lift[] = [
      { weight: 80, reps: 5, date: TODAY }, // old version of today's data
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY },
      { weight: 105, reps: 3, date: TODAY },
    ];
    const merged = mergeLifts(stored, session, TODAY);
    expect(merged.filter((l) => l.date === TODAY)).toHaveLength(2);
    expect(merged.find((l) => l.weight === 80)).toBeUndefined();
  });

  it("handles empty stored lifts", () => {
    const session: Lift[] = [{ weight: 100, reps: 5, date: TODAY }];
    expect(mergeLifts([], session, TODAY)).toEqual(session);
  });

  it("handles empty session lifts", () => {
    const stored: Lift[] = [{ weight: 90, reps: 8, date: "2026-04-20" }];
    expect(mergeLifts(stored, [], TODAY)).toEqual(stored);
  });
});
