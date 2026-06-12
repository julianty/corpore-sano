import {
  normalizeExerciseKey,
  getCurrentWeekMonday,
  computeStats,
  mergeLifts,
  removeWorkoutLifts,
} from "./exerciseHistory";
import type { Lift } from "./exerciseHistory";

// --- normalizeExerciseKey ---

describe("normalizeExerciseKey", () => {
  it("lowercases and camelCases spaces", () => {
    expect(normalizeExerciseKey("Bench Press")).toBe("benchPress");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeExerciseKey("  Overhead Press  ")).toBe("overheadPress");
  });

  it("strips parentheses and other non-alphanumeric chars", () => {
    expect(normalizeExerciseKey("Dumbbell Row (Single Arm)")).toBe(
      "dumbbellRowSingleArm",
    );
  });

  it("collapses consecutive non-alphanumeric chars into a single boundary", () => {
    expect(normalizeExerciseKey("Push  --  Up")).toBe("pushUp");
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
  { weight: 100, reps: 5, date: "2026-04-27", workoutId: "w3" },
  { weight: 110, reps: 5, date: "2026-04-28", workoutId: "w4" },
  { weight: 120, reps: 3, date: "2026-04-28", workoutId: "w4" },
];
const LAST_WEEK: Lift[] = [
  { weight: 90, reps: 8, date: "2026-04-20", workoutId: "w1" },
  { weight: 95, reps: 8, date: "2026-04-21", workoutId: "w2" },
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
    expect(stats.bestSetWeight).toBe(0);
    expect(stats.bestSetReps).toBe(0);
  });

  it("picks the set with the highest weight*reps as the best set", () => {
    const stats = computeStats([...LAST_WEEK, ...THIS_WEEK], MONDAY);
    // LAST_WEEK: 90*8=720, 95*8=760 ← winner; THIS_WEEK: 100*5=500, 110*5=550, 120*3=360
    expect(stats.bestSetWeight).toBe(95);
    expect(stats.bestSetReps).toBe(8);
  });

  it("computes median for an even-length array as the average of two middle values", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-27", workoutId: "w1" },
      { weight: 200, reps: 5, date: "2026-04-27", workoutId: "w1" },
    ];
    const stats = computeStats(lifts, MONDAY);
    expect(stats.medianWeight).toBe(150);
  });
});

// --- mergeLifts ---

const TODAY = "2026-04-28";

describe("mergeLifts", () => {
  it("preserves other workouts' lifts and appends this workout's session lifts", () => {
    const stored: Lift[] = [
      { weight: 90, reps: 8, date: "2026-04-20", workoutId: "w1" },
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: "w2" },
    ];
    const merged = mergeLifts(stored, session, "w2");
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(stored[0]);
    expect(merged).toContainEqual(session[0]);
  });

  it("replaces stored lifts from the same workout rather than duplicating them", () => {
    const stored: Lift[] = [
      { weight: 80, reps: 5, date: TODAY, workoutId: "w2" }, // old version of this workout's data
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: "w2" },
      { weight: 105, reps: 3, date: TODAY, workoutId: "w2" },
    ];
    const merged = mergeLifts(stored, session, "w2");
    expect(merged).toHaveLength(2);
    expect(merged.find((l) => l.weight === 80)).toBeUndefined();
  });

  it("preserves a different same-day workout's lifts (C2 regression)", () => {
    // Morning workout w1 and evening workout w2 on the same date, same exercise
    const stored: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: "w1" },
      { weight: 100, reps: 5, date: TODAY, workoutId: "w1" },
    ];
    const session: Lift[] = [
      { weight: 110, reps: 3, date: TODAY, workoutId: "w2" },
    ];
    const merged = mergeLifts(stored, session, "w2");
    expect(merged).toHaveLength(3);
    expect(merged.filter((l) => l.workoutId === "w1")).toHaveLength(2);
    expect(merged.filter((l) => l.workoutId === "w2")).toHaveLength(1);
  });

  it("leaves no old-date duplicates when a workout's date changes", () => {
    const stored: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-27", workoutId: "w2" },
    ];
    // Same workout re-flushed after its date was edited to TODAY
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: "w2" },
    ];
    const merged = mergeLifts(stored, session, "w2");
    expect(merged).toHaveLength(1);
    expect(merged[0].date).toBe(TODAY);
  });

  it("handles empty stored lifts", () => {
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: "w2" },
    ];
    expect(mergeLifts([], session, "w2")).toEqual(session);
  });

  it("handles empty session lifts", () => {
    const stored: Lift[] = [
      { weight: 90, reps: 8, date: "2026-04-20", workoutId: "w1" },
    ];
    expect(mergeLifts(stored, [], "w2")).toEqual(stored);
  });
});

// --- removeWorkoutLifts ---

describe("removeWorkoutLifts", () => {
  it("removes only the target workout's lifts, even with identical weight/reps elsewhere (H3 regression)", () => {
    const allLifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-20", workoutId: "w1" },
      { weight: 100, reps: 5, date: "2026-04-27", workoutId: "w2" },
      { weight: 100, reps: 5, date: "2026-04-27", workoutId: "w3" },
    ];
    const remaining = removeWorkoutLifts(allLifts, "w1");
    expect(remaining).toHaveLength(2);
    expect(remaining.every((l) => l.workoutId !== "w1")).toBe(true);
  });

  it("returns all lifts unchanged when no lift matches the workout", () => {
    const allLifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-20", workoutId: "w1" },
    ];
    expect(removeWorkoutLifts(allLifts, "wX")).toEqual(allLifts);
  });

  it("returns an empty array when every lift belongs to the workout", () => {
    const allLifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-20", workoutId: "w1" },
      { weight: 110, reps: 3, date: "2026-04-20", workoutId: "w1" },
    ];
    expect(removeWorkoutLifts(allLifts, "w1")).toEqual([]);
  });
});
