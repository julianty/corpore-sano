import {
  normalizeExerciseKey,
  getCurrentWeekMonday,
  computeStats,
  mergeLifts,
  removeMatchingLifts,
} from "./exerciseHistory";
import type { Lift } from "./exerciseHistory";

// --- normalizeExerciseKey ---

describe("normalizeExerciseKey", () => {
  it("converts multi-word names to camelCase", () => {
    expect(normalizeExerciseKey("Bench Press")).toBe("benchPress");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeExerciseKey("  Overhead Press  ")).toBe("overheadPress");
  });

  it("strips non-alphanumeric chars and camelCases the following letter", () => {
    expect(normalizeExerciseKey("Dumbbell Row (Single Arm)")).toBe(
      "dumbbellRowSingleArm",
    );
  });

  it("collapses consecutive non-alphanumeric chars into one camel bump", () => {
    expect(normalizeExerciseKey("Push  --  Up")).toBe("pushUp");
  });

  it("handles already-lowercase single-word input", () => {
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
      { weight: 100, reps: 5, date: "2026-04-27" },
      { weight: 200, reps: 5, date: "2026-04-27" },
    ];
    const stats = computeStats(lifts, MONDAY);
    expect(stats.medianWeight).toBe(150);
  });
});

// --- mergeLifts ---

const TODAY = "2026-04-28";
const WORKOUT_A = "workoutA";
const WORKOUT_B = "workoutB";

describe("mergeLifts", () => {
  it("preserves lifts from other workouts and appends this workout's session lifts", () => {
    const stored: Lift[] = [
      { weight: 90, reps: 8, date: "2026-04-20", workoutId: WORKOUT_A },
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: WORKOUT_B },
    ];
    const merged = mergeLifts(stored, session, WORKOUT_B);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(stored[0]);
    expect(merged).toContainEqual(session[0]);
  });

  it("replaces stored lifts from the same workout rather than duplicating them", () => {
    const stored: Lift[] = [
      { weight: 80, reps: 5, date: TODAY, workoutId: WORKOUT_A }, // old version of this workout's data
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: WORKOUT_A },
      { weight: 105, reps: 3, date: TODAY, workoutId: WORKOUT_A },
    ];
    const merged = mergeLifts(stored, session, WORKOUT_A);
    expect(merged).toHaveLength(2);
    expect(merged.find((l) => l.weight === 80)).toBeUndefined();
  });

  it("does not clobber a same-day lift logged under a different workout", () => {
    // This is the bug this function exists to prevent: two workouts on the same
    // calendar day must not erase each other's history.
    const stored: Lift[] = [
      { weight: 90, reps: 8, date: TODAY, workoutId: WORKOUT_A },
    ];
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: WORKOUT_B },
    ];
    const merged = mergeLifts(stored, session, WORKOUT_B);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(stored[0]);
  });

  it("never replaces a legacy lift that has no workoutId", () => {
    const stored: Lift[] = [{ weight: 90, reps: 8, date: TODAY }]; // pre-migration lift
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: WORKOUT_A },
    ];
    const merged = mergeLifts(stored, session, WORKOUT_A);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(stored[0]);
  });

  it("handles empty stored lifts", () => {
    const session: Lift[] = [
      { weight: 100, reps: 5, date: TODAY, workoutId: WORKOUT_A },
    ];
    expect(mergeLifts([], session, WORKOUT_A)).toEqual(session);
  });

  it("handles empty session lifts for a different workout", () => {
    const stored: Lift[] = [
      { weight: 90, reps: 8, date: "2026-04-20", workoutId: WORKOUT_A },
    ];
    expect(mergeLifts(stored, [], WORKOUT_B)).toEqual(stored);
  });
});

// --- removeMatchingLifts ---

describe("removeMatchingLifts", () => {
  it("removes a lift whose weight and reps match", () => {
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-04-28" }];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 5 }]);
    expect(result).toHaveLength(0);
  });

  it("leaves unmatched lifts untouched", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-28" },
      { weight: 90, reps: 8, date: "2026-04-20" },
    ];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 5 }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ weight: 90, reps: 8, date: "2026-04-20" });
  });

  it("matches on weight+reps only when the set has no date", () => {
    // Callers that can't determine a date fall back to weight+reps matching.
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-01-01" }];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 5 }]);
    expect(result).toHaveLength(0);
  });

  it("does not remove a same weight+reps lift logged on a different day", () => {
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-01-01" }];
    const result = removeMatchingLifts(lifts, [
      { weight: 100, reps: 5, date: "2026-04-28" },
    ]);
    expect(result).toHaveLength(1);
  });

  it("removes a lift when weight, reps, and date all match", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-01-01" },
      { weight: 100, reps: 5, date: "2026-04-28" },
    ];
    const result = removeMatchingLifts(lifts, [
      { weight: 100, reps: 5, date: "2026-04-28" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-01-01");
  });

  it("consumes duplicates one-to-one — only removes the exact count requested", () => {
    // Two identical lifts in history; caller removes one → one should remain.
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-27" },
      { weight: 100, reps: 5, date: "2026-04-28" },
    ];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 5 }]);
    expect(result).toHaveLength(1);
  });

  it("removes multiple distinct lifts in one call", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-28" },
      { weight: 110, reps: 3, date: "2026-04-28" },
      { weight: 90, reps: 8, date: "2026-04-20" },
    ];
    const result = removeMatchingLifts(lifts, [
      { weight: 100, reps: 5 },
      { weight: 110, reps: 3 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(90);
  });

  it("returns all lifts unchanged when sets is empty", () => {
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-04-28" }];
    expect(removeMatchingLifts(lifts, [])).toEqual(lifts);
  });

  it("returns empty array when every lift is matched", () => {
    const lifts: Lift[] = [
      { weight: 100, reps: 5, date: "2026-04-28" },
      { weight: 90, reps: 8, date: "2026-04-20" },
    ];
    const result = removeMatchingLifts(lifts, [
      { weight: 100, reps: 5 },
      { weight: 90, reps: 8 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("does not remove a lift when only weight matches but reps differ", () => {
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-04-28" }];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 8 }]);
    expect(result).toHaveLength(1);
  });
});
