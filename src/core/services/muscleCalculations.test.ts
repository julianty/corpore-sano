import {
  buildMuscleSummary,
  rollupToParentGroups,
  getLastWorkedFreshness,
} from "./muscleCalculations";
import { createExerciseMap } from "../../utils/exerciseLookup";

// --- fixtures ---

const mockExerciseCatalog = [
  { name: "Bench Press", muscles: ["Pectorals", "Triceps", "Deltoids"] },
  { name: "Squat", muscles: ["Quadriceps", "Glutes", "Hamstrings"] },
  { name: "Overhead Press", muscles: ["Deltoids", "Triceps"] },
];

const exerciseMap = createExerciseMap(mockExerciseCatalog);

// Minimal Timestamp stub — mirrors the shape that buildMuscleSummary expects
const ts = (date: Date) => ({ toDate: () => date }) as any;

// Fixed getDaysSince — keeps assertions deterministic
const DAYS = 3;
const getDaysSince = () => DAYS;

// --- buildMuscleSummary tests ---

describe("buildMuscleSummary", () => {
  it("returns all muscles initialised to 0 sets for empty workouts", () => {
    const result = buildMuscleSummary([], exerciseMap, getDaysSince);
    expect(result["Pectorals"].sets).toBe(0);
    expect(result["Quadriceps"].sets).toBe(0);
    expect(result["Deltoids"].sets).toBe(0);
  });

  it("accumulates sets for each muscle worked in a single workout", () => {
    const workout = {
      date: ts(new Date()),
      ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].sets).toBe(3);
    expect(result["Triceps"].sets).toBe(3);
    expect(result["Deltoids"].sets).toBe(3);
    expect(result["Quadriceps"].sets).toBe(0); // Squat not performed
  });

  it("accumulates sets across multiple workouts", () => {
    const workouts = [
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 4, reps: 8, weightkg: 100 },
      } as any,
    ];

    const result = buildMuscleSummary(workouts, exerciseMap, getDaysSince);

    expect(result["Pectorals"].sets).toBe(7);
  });

  it("handles multiple exercises within a single workout", () => {
    const workout = {
      date: ts(new Date()),
      ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      ex2: { name: "Squat", sets: 4, reps: 8, weightkg: 100 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].sets).toBe(3);
    expect(result["Quadriceps"].sets).toBe(4);
    expect(result["Deltoids"].sets).toBe(3); // Only Bench Press, not Squat
  });

  it("uses weightkg for weightTotal when both fields are present", () => {
    const workout = {
      date: ts(new Date()),
      ex1: {
        name: "Bench Press",
        sets: 3,
        reps: 10,
        weightkg: 80,
        weightlbs: 176,
      },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].weightTotal).toBe(3 * 10 * 80);
  });

  it("falls back to weightlbs when weightkg is absent", () => {
    const workout = {
      date: ts(new Date()),
      ex1: { name: "Bench Press", sets: 3, reps: 10, weightlbs: 176 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].weightTotal).toBe(3 * 10 * 176);
  });

  it("uses 0 for weight when both weightkg and weightlbs are absent", () => {
    const workout = {
      date: ts(new Date()),
      ex1: { name: "Bench Press", sets: 3, reps: 10 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].weightTotal).toBe(0);
  });

  it("stores getDaysSince result as lastWorked on each worked muscle", () => {
    const workout = {
      date: ts(new Date("2024-01-01")),
      ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, () => 5);

    expect(result["Pectorals"].lastWorked).toBe(5);
    expect(result["Triceps"].lastWorked).toBe(5);
    expect(result["Deltoids"].lastWorked).toBe(5);
  });

  it("skips exercises not found in the exercise map without throwing", () => {
    const workout = {
      date: ts(new Date()),
      ex1: { name: "Unknonwn Exercise XYZ", sets: 3, reps: 10, weightkg: 80 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSince);

    expect(result["Pectorals"].sets).toBe(0);
  });

  it("does not call getDaysSince and sets lastWorked to 0 when workout.date is undefined", () => {
    const getDaysSinceSpy = jest.fn(() => 99);
    const workout = {
      date: undefined,
      ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
    } as any;

    const result = buildMuscleSummary([workout], exerciseMap, getDaysSinceSpy);

    expect(getDaysSinceSpy).not.toHaveBeenCalled();
    expect(result["Pectorals"].lastWorked).toBe(0);
  });
});

// --- rollupToParentGroups tests ---

describe("rollupToParentGroups", () => {
  it("returns all parent groups with 0 sets when no muscles were worked", () => {
    const allZero = buildMuscleSummary([], exerciseMap, getDaysSince);
    const result = rollupToParentGroups(allZero);

    expect(result["Chest"].sets).toBe(0);
    expect(result["Arms"].sets).toBe(0);
    expect(result["Legs"].sets).toBe(0);
    expect(result["Chest"].daysSinceLast).toBeUndefined();
  });

  it("rolls each child muscle up to the correct parent group", () => {
    const muscleSummary = buildMuscleSummary(
      [
        {
          date: ts(new Date()),
          ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
        } as any,
      ],
      exerciseMap,
      getDaysSince,
    );

    const result = rollupToParentGroups(muscleSummary);

    // Bench Press works Pectorals → Chest, Triceps → Arms, Deltoids → Shoulders
    expect(result["Chest"].sets).toBe(3);
    expect(result["Arms"].sets).toBe(3);
    expect(result["Shoulders"].sets).toBe(3);
    expect(result["Legs"].sets).toBe(0);
  });

  it("sums sets from multiple children in the same parent group", () => {
    // Bench Press → Triceps(3) + Deltoids(3) | Overhead Press → Triceps(3) + Deltoids(3)
    const workouts = [
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
      {
        date: ts(new Date()),
        ex1: { name: "Overhead Press", sets: 3, reps: 10, weightkg: 60 },
      } as any,
    ];
    const muscleSummary = buildMuscleSummary(
      workouts,
      exerciseMap,
      getDaysSince,
    );
    const result = rollupToParentGroups(muscleSummary);

    // Triceps (Arms): 3 + 3 = 6
    expect(result["Arms"].sets).toBe(6);
    // Deltoids (Shoulders): 3 + 3 = 6
    expect(result["Shoulders"].sets).toBe(6);
  });

  it("counts sets only once per parent group when one exercise works multiple muscles in the same group", () => {
    // Squat works Quadriceps, Glutes, Hamstrings — all map to "Legs"
    // 3 sets of Squat should contribute 3 sets to Legs, not 9
    const muscleSummary = buildMuscleSummary(
      [
        {
          date: ts(new Date()),
          ex1: { name: "Squat", sets: 3, reps: 8, weightkg: 100 },
        } as any,
      ],
      exerciseMap,
      getDaysSince,
    );

    const result = rollupToParentGroups(muscleSummary);

    expect(result["Legs"].sets).toBe(3);
  });

  it("sets daysSinceLast to the minimum lastWorked across child muscles", () => {
    const muscleSummary = {
      Trapezius: {
        name: "Trapezius",
        sets: 3,
        weightTotal: 0,
        parentGroup: "Back",
        lastWorked: 5,
      },
      Rhomboids: {
        name: "Rhomboids",
        sets: 2,
        weightTotal: 0,
        parentGroup: "Back",
        lastWorked: 2,
      },
    };

    const result = rollupToParentGroups(muscleSummary as any);

    expect(result["Back"].sets).toBe(5);
    expect(result["Back"].daysSinceLast).toBe(2); // min(5, 2)
  });

  it("defaults lastWorked to 8 when muscle.lastWorked is undefined", () => {
    const muscleSummary = {
      Pectorals: {
        name: "Pectorals",
        sets: 3,
        weightTotal: 0,
        parentGroup: "Chest",
        lastWorked: undefined,
      },
    };

    const result = rollupToParentGroups(muscleSummary as any);

    expect(result["Chest"].daysSinceLast).toBe(8);
  });

  it("includes lastWorked from muscles with 0 sets (outside sets window)", () => {
    const muscleSummary = {
      Pectorals: {
        name: "Pectorals",
        sets: 0,
        weightTotal: 0,
        parentGroup: "Chest",
        lastWorked: 10,
      },
    };

    const result = rollupToParentGroups(muscleSummary as any);

    expect(result["Chest"].sets).toBe(0);
    expect(result["Chest"].daysSinceLast).toBe(10);
  });

  it("skips muscles with 0 sets and no lastWorked", () => {
    const muscleSummary = {
      Pectorals: {
        name: "Pectorals",
        sets: 0,
        weightTotal: 0,
        parentGroup: "Chest",
        lastWorked: undefined,
      },
    };

    const result = rollupToParentGroups(muscleSummary as any);

    expect(result["Chest"].sets).toBe(0);
    expect(result["Chest"].daysSinceLast).toBeUndefined();
  });
});

// --- buildMuscleSummary lastWorked Math.min fix ---

describe("buildMuscleSummary lastWorked uses Math.min", () => {
  it("keeps the smallest daysSince when a muscle appears in multiple workouts", () => {
    // Workout 1 was 5 days ago, Workout 2 was 1 day ago — both hit Pectorals via Bench Press
    let callCount = 0;
    const getDaysSinceSequence = () => {
      callCount++;
      return callCount === 1 ? 5 : 1; // first workout = 5 days, second = 1 day
    };

    const workouts = [
      {
        date: ts(new Date("2024-01-01")),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
      {
        date: ts(new Date("2024-01-05")),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
    ];

    const result = buildMuscleSummary(
      workouts,
      exerciseMap,
      getDaysSinceSequence,
    );

    expect(result["Pectorals"].lastWorked).toBe(1); // min(5, 1)
    expect(result["Triceps"].lastWorked).toBe(1);
    expect(result["Deltoids"].lastWorked).toBe(1);
  });
});

// --- getLastWorkedFreshness tests ---

describe("getLastWorkedFreshness", () => {
  it("returns 'fresh' for 0 days", () => {
    expect(getLastWorkedFreshness(0)).toBe("fresh");
  });

  it("returns 'fresh' for 2 days", () => {
    expect(getLastWorkedFreshness(2)).toBe("fresh");
  });

  it("returns 'moderate' for 3 days", () => {
    expect(getLastWorkedFreshness(3)).toBe("moderate");
  });

  it("returns 'moderate' for 4 days", () => {
    expect(getLastWorkedFreshness(4)).toBe("moderate");
  });

  it("returns 'stale' for 5 days", () => {
    expect(getLastWorkedFreshness(5)).toBe("stale");
  });

  it("returns 'stale' for 7+ days", () => {
    expect(getLastWorkedFreshness(10)).toBe("stale");
  });

  it("returns 'stale' for undefined", () => {
    expect(getLastWorkedFreshness(undefined)).toBe("stale");
  });
});

// --- setsWindowDays tests ---

describe("buildMuscleSummary with setsWindowDays", () => {
  it("excludes sets from workouts outside the sets window", () => {
    const workouts = [
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
    ];

    // Workout is 10 days old, window is 7 days
    const result = buildMuscleSummary(workouts, exerciseMap, () => 10, 7);

    expect(result["Pectorals"].sets).toBe(0);
    expect(result["Pectorals"].weightTotal).toBe(0);
  });

  it("still tracks lastWorked for workouts outside the sets window", () => {
    const workouts = [
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
    ];

    const result = buildMuscleSummary(workouts, exerciseMap, () => 10, 7);

    expect(result["Pectorals"].lastWorked).toBe(10);
  });

  it("includes sets from workouts within the sets window", () => {
    const workouts = [
      {
        date: ts(new Date()),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
    ];

    const result = buildMuscleSummary(workouts, exerciseMap, () => 5, 7);

    expect(result["Pectorals"].sets).toBe(3);
    expect(result["Pectorals"].lastWorked).toBe(5);
  });

  it("splits sets and lastWorked across windows correctly", () => {
    let callCount = 0;
    const getDaysSinceSeq = () => {
      callCount++;
      return callCount === 1 ? 10 : 3; // first workout 10 days ago, second 3 days ago
    };

    const workouts = [
      {
        date: ts(new Date("2024-01-01")),
        ex1: { name: "Bench Press", sets: 4, reps: 10, weightkg: 80 },
      } as any,
      {
        date: ts(new Date("2024-01-08")),
        ex1: { name: "Bench Press", sets: 3, reps: 10, weightkg: 80 },
      } as any,
    ];

    const result = buildMuscleSummary(
      workouts,
      exerciseMap,
      getDaysSinceSeq,
      7,
    );

    // Only the second workout (3 days ago) contributes sets
    expect(result["Pectorals"].sets).toBe(3);
    // lastWorked is min(10, 3) = 3
    expect(result["Pectorals"].lastWorked).toBe(3);
  });
});
