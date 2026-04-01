import { buildMuscleSummary, rollupToParentGroups } from "./muscleCalculations";
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

  it("skips muscles with 0 sets — leaving parent group at 0 with no daysSinceLast", () => {
    const muscleSummary = {
      Pectorals: {
        name: "Pectorals",
        sets: 0,
        weightTotal: 0,
        parentGroup: "Chest",
        lastWorked: 1,
      },
    };

    const result = rollupToParentGroups(muscleSummary as any);

    expect(result["Chest"].sets).toBe(0);
    expect(result["Chest"].daysSinceLast).toBeUndefined();
  });
});
