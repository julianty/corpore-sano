import { Timestamp } from "firebase/firestore";
import { ExerciseMap, Workout } from "../../types";

/**
 * Extracts the ExerciseMap from a Firestore workout document.
 * Exercises are stored nested under `exercises`, not as flat top-level
 * keys alongside `date`/`durationSeconds`.
 */
export function workoutToExerciseMap(workout: Workout): ExerciseMap {
  const exercises = workout.exercises ?? {};
  return Object.fromEntries(
    Object.entries(exercises).map(([key, exercise]) => [
      key,
      Array.isArray(exercise?.sets) ? exercise : { ...exercise, sets: [] },
    ]),
  ) as ExerciseMap;
}

/**
 * Builds a Workout document ready to write to Firestore, nesting the
 * given exercises under `exercises` and preserving `durationSeconds`.
 */
export function exerciseMapToWorkout(
  exercises: ExerciseMap,
  date: Timestamp | undefined,
  durationSeconds?: number,
): Workout {
  return {
    date,
    exercises,
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
  };
}
