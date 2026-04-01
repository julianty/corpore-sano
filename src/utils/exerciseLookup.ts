/**
 * Exercise Lookup Utilities
 * Provides efficient O(1) lookup of exercises by name using Map
 * Replaces O(N) filter operations with constant-time access
 */

/**
 * Creates a Map of exercises indexed by name for O(1) lookup
 * @param exerciseCatalog - Array of exercise records
 * @returns Map with exercise name as key
 */
export function createExerciseMap(exerciseCatalog: any[]): Map<string, any> {
  return new Map(exerciseCatalog.map((exercise) => [exercise.name, exercise]));
}

/**
 * Gets an exercise by name using the Map lookup
 * @param map - Exercise Map created by createExerciseMap
 * @param name - Exercise name to look up
 * @returns Exercise record or null if not found
 */
export function getExerciseByName(
  map: Map<string, any>,
  name: string,
): any | null {
  return map.get(name) || null;
}
