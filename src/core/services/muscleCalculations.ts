import { Workout, MuscleSummary, SetEntry } from "../../types";
import { muscleGroups as muscleGroupsData } from "../../data/muscleGroups";
import { getExerciseByName } from "../../utils/exerciseLookup";

export interface ParentGroupSummary {
  [group: string]: { sets: number; daysSinceLast?: number };
}

/**
 * Pure function: builds a MuscleSummary from a list of workouts.
 * No React, no Firebase — safe to reuse in React Native.
 *
 * @param workouts        - Array of workouts with date + exercise entries
 * @param exerciseMap     - Pre-built Map<name, exerciseCatalogEntry> for O(1) lookup
 * @param getDaysSince    - Injected date helper: days between a past date and today
 * @param setsWindowDays  - Only count sets/weight for workouts within this many days.
 *                          Workouts outside this window still contribute to lastWorked.
 * @param customExercises - User-defined exercises: id → { name, muscleGroup }.
 *                          Used as fallback when exercise is not in the catalog.
 */
export function buildMuscleSummary(
  workouts: Workout[],
  exerciseMap: Map<string, unknown>,
  getDaysSince: (date: Date) => number,
  setsWindowDays?: number,
  customExercises?: Record<
    string,
    { name: string; muscleGroup: string | null }
  >,
): MuscleSummary {
  const muscleGroups: MuscleSummary = {};
  Object.values(muscleGroupsData).forEach((muscle) => {
    muscleGroups[muscle.name] = {
      name: muscle.name,
      sets: 0,
      weightTotal: 0,
      parentGroup: muscle.parentGroup,
    };
  });

  // Synthetic entries for custom exercises tagged to a parent group
  const PARENT_GROUPS = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];
  PARENT_GROUPS.forEach((group) => {
    muscleGroups[`_custom_${group}`] = {
      name: `_custom_${group}`,
      sets: 0,
      weightTotal: 0,
      parentGroup: group,
    };
  });

  workouts.forEach((workout) => {
    const daysSinceWorkout = workout.date
      ? getDaysSince(workout.date.toDate())
      : 0;

    Object.entries(workout).forEach(([key, value]) => {
      if (key === "date" || !value || typeof value !== "object") return;
      const exerciseEntry = value as {
        name: string;
        sets: SetEntry[];
        customExerciseId?: string;
      };
      if (!Array.isArray(exerciseEntry.sets)) return;

      const exercise = getExerciseByName(exerciseMap, exerciseEntry.name);

      if (!exercise) {
        // Look up by ID first; fall back to name scan for entries created before the ID system
        let customGroup: string | null | undefined;
        if (exerciseEntry.customExerciseId) {
          customGroup =
            customExercises?.[exerciseEntry.customExerciseId]?.muscleGroup;
        } else {
          const entry = Object.values(customExercises ?? {}).find(
            (e) => e.name === exerciseEntry.name,
          );
          customGroup = entry?.muscleGroup;
        }
        if (!customGroup) return;
        const syntheticKey = `_custom_${customGroup}`;
        if (!muscleGroups[syntheticKey]) return;
        const withinSetsWindow =
          setsWindowDays === undefined || daysSinceWorkout <= setsWindowDays;
        if (withinSetsWindow) {
          muscleGroups[syntheticKey].sets += exerciseEntry.sets.length;
          muscleGroups[syntheticKey].weightTotal! += exerciseEntry.sets.reduce(
            (acc, s) => acc + s.reps * (s.weightkg ?? s.weightlbs ?? 0),
            0,
          );
        }
        muscleGroups[syntheticKey].lastWorked =
          muscleGroups[syntheticKey].lastWorked !== undefined
            ? Math.min(muscleGroups[syntheticKey].lastWorked!, daysSinceWorkout)
            : daysSinceWorkout;
        return;
      }

      // Track parent groups already credited for this exercise so that exercises
      // working multiple muscles in the same parent group (e.g. Squat → Legs)
      // only count their sets once toward that parent group.
      const parentGroupsSeen = new Set<string>();

      (exercise as { muscles: string[] }).muscles.forEach((muscleName) => {
        if (!muscleGroups[muscleName]) return;
        const withinSetsWindow =
          setsWindowDays === undefined || daysSinceWorkout <= setsWindowDays;
        if (withinSetsWindow) {
          const parentGroup = muscleGroups[muscleName].parentGroup;
          if (!parentGroupsSeen.has(parentGroup)) {
            parentGroupsSeen.add(parentGroup);
            muscleGroups[muscleName].sets += exerciseEntry.sets.length;
            muscleGroups[muscleName].weightTotal! += exerciseEntry.sets.reduce(
              (acc, s) => acc + s.reps * (s.weightkg ?? s.weightlbs ?? 0),
              0,
            );
          }
        }
        muscleGroups[muscleName].lastWorked =
          muscleGroups[muscleName].lastWorked !== undefined
            ? Math.min(muscleGroups[muscleName].lastWorked!, daysSinceWorkout)
            : daysSinceWorkout;
      });
    });
  });

  return muscleGroups;
}

/**
 * Rolls up child muscle groups into the 6 parent group summaries
 * (Shoulders, Back, Chest, Arms, Core, Legs).
 */
/**
 * Returns a freshness category based on days since a muscle group was last worked.
 * "fresh" = 0–2 days, "moderate" = 3–4 days, "stale" = 5+ days or undefined.
 */
export function getLastWorkedFreshness(
  daysSinceLast: number | undefined,
): "fresh" | "moderate" | "stale" {
  if (daysSinceLast === undefined || daysSinceLast >= 5) return "stale";
  if (daysSinceLast >= 3) return "moderate";
  return "fresh";
}

export function rollupToParentGroups(
  muscleSummary: MuscleSummary,
): ParentGroupSummary {
  const result: ParentGroupSummary = {
    Shoulders: { sets: 0 },
    Back: { sets: 0 },
    Chest: { sets: 0 },
    Arms: { sets: 0 },
    Core: { sets: 0 },
    Legs: { sets: 0 },
  };

  Object.values(muscleSummary).forEach((muscleObj) => {
    if (muscleObj.sets === 0 && muscleObj.lastWorked === undefined) return;
    const parent = muscleObj.parentGroup;
    if (!(parent in result)) return;

    const lastWorked =
      muscleObj.lastWorked !== undefined ? muscleObj.lastWorked : 8;
    const current = result[parent];

    result[parent] = {
      sets: current.sets + muscleObj.sets,
      daysSinceLast:
        current.daysSinceLast !== undefined
          ? Math.min(current.daysSinceLast, lastWorked)
          : lastWorked,
    };
  });

  return result;
}
