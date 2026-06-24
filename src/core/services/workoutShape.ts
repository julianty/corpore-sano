import { Workout, ExerciseMap } from "../../types";

/**
 * Reads the exercise entries from a workout doc.
 *
 * Exercise entries are stored under `workout.exercises` (a UUID-keyed
 * sub-map). This is the single source of truth for iterating a workout's
 * exercises — never scan the workout's own keys and filter out `date`, since
 * scalar fields like `durationSeconds` would otherwise be mistaken for
 * exercises.
 *
 * Accepts a loose record so callers holding raw Firestore `DocumentData`
 * (not yet cast to `Workout`) can use it too.
 */
export function getExerciseEntries(
  workout: Pick<Workout, "exercises"> | Record<string, unknown> | null | undefined,
): ExerciseMap {
  return ((workout as Workout | null | undefined)?.exercises ?? {}) as ExerciseMap;
}
