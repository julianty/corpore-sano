import { Timestamp } from "firebase/firestore";
import { workoutToExerciseMap, exerciseMapToWorkout } from "./workoutTransforms";
import { Workout } from "../../types";

// Shaped exactly like a real production Firestore workout document:
// exercises nested under `exercises`, not flattened alongside `date`.
const realShapedWorkout: Workout = {
  date: Timestamp.fromDate(new Date("2026-07-22T18:57:29.075Z")),
  exercises: {
    exercise_1784577727845: {
      order: 0,
      name: "Squat",
      variant: "Barbell Back Squat",
      sets: [{ reps: 5, weightlbs: 185, weightkg: 85 }],
    },
    exercise_1784747799159: {
      order: 1,
      name: "Machine Overhead Tricep Extension",
      variant: "Machine Overhead Tricep Extension",
      customExerciseId: "mrwgrwze96bvflkm7li",
      sets: [{ reps: 10, weightlbs: 0, weightkg: 0 }],
    },
  },
  durationSeconds: 2700,
};

describe("workoutToExerciseMap", () => {
  it("reads exercises from the nested `exercises` field", () => {
    const result = workoutToExerciseMap(realShapedWorkout);
    expect(Object.keys(result)).toEqual([
      "exercise_1784577727845",
      "exercise_1784747799159",
    ]);
    expect(result.exercise_1784577727845.sets).toEqual([
      { reps: 5, weightlbs: 185, weightkg: 85 },
    ]);
    expect(result.exercise_1784747799159.customExerciseId).toBe(
      "mrwgrwze96bvflkm7li",
    );
  });

  it("does not produce a bogus pseudo-exercise for the `exercises` key itself", () => {
    const result = workoutToExerciseMap(realShapedWorkout);
    expect(result.exercises).toBeUndefined();
  });

  it("defaults sets to [] when an exercise entry is missing a sets array", () => {
    const workout: Workout = {
      date: undefined,
      exercises: {
        broken: { order: 0, name: "X", variant: "X" } as never,
      },
    };
    const result = workoutToExerciseMap(workout);
    expect(result.broken.sets).toEqual([]);
  });

  it("returns an empty map when exercises is missing", () => {
    const workout = { date: undefined } as unknown as Workout;
    expect(workoutToExerciseMap(workout)).toEqual({});
  });
});

describe("exerciseMapToWorkout", () => {
  it("nests the exercise map under `exercises` and preserves durationSeconds", () => {
    const map = workoutToExerciseMap(realShapedWorkout);
    const rebuilt = exerciseMapToWorkout(map, realShapedWorkout.date, 2700);
    expect(rebuilt.exercises).toEqual(map);
    expect(rebuilt.durationSeconds).toBe(2700);
    expect(rebuilt.date).toBe(realShapedWorkout.date);
  });

  it("omits durationSeconds when not provided", () => {
    const rebuilt = exerciseMapToWorkout({}, undefined);
    expect(rebuilt).not.toHaveProperty("durationSeconds");
  });
});

describe("round-trip", () => {
  it("workoutToExerciseMap -> exerciseMapToWorkout reproduces the original exercises", () => {
    const map = workoutToExerciseMap(realShapedWorkout);
    const rebuilt = exerciseMapToWorkout(
      map,
      realShapedWorkout.date,
      realShapedWorkout.durationSeconds,
    );
    expect(rebuilt.exercises).toEqual(realShapedWorkout.exercises);
  });
});
