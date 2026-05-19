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

  it("ignores date — matches on weight+reps only", () => {
    // The caller passes raw in-memory sets which have no date, so the match
    // must work regardless of what date string Firestore stored.
    const lifts: Lift[] = [{ weight: 100, reps: 5, date: "2026-01-01" }];
    const result = removeMatchingLifts(lifts, [{ weight: 100, reps: 5 }]);
    expect(result).toHaveLength(0);
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
