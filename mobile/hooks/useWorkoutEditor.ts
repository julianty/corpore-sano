import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { Workout, Exercise, ExerciseMap, SetEntry } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { normalizeExerciseKey } from "@shared/core/services/exerciseHistory";
import {
  workoutToExerciseMap,
  exerciseMapToWorkout,
} from "@shared/core/services/workoutTransforms";
import { useExerciseHistoryWriter } from "./useExerciseHistoryWriter";

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: [],
};

export function useWorkoutEditor(userId: string | null, workoutId: string) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const { scheduleWrite, flushKey, cancelKey } = useExerciseHistoryWriter(userId);

  useEffect(() => {
    if (!userId) return;
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId]);

  const exercisesObject: ExerciseMap = workout ? workoutToExerciseMap(workout) : {};

  async function saveWorkout(updated: Workout) {
    if (!userId) return;
    setWorkout(updated);
    await FirestoreActions.updateWorkoutById(userId, workoutId, updated);
  }

  function saveExercises(updatedExercises: ExerciseMap) {
    if (!workout) return;
    saveWorkout(
      exerciseMapToWorkout(updatedExercises, workout.date, workout.durationSeconds),
    );
  }

  function onSetsChange(key: string, sets: SetEntry[]) {
    if (!workout) return;
    const updated: ExerciseMap = { ...exercisesObject, [key]: { ...exercisesObject[key], sets } };
    saveExercises(updated);
    const workoutDateStr =
      workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    scheduleWrite(key, updated, workoutDateStr, workoutId);
  }

  async function exerciseNameChangeHandler(
    name: string,
    variant: string,
    key: string,
    customExerciseId?: string,
  ) {
    if (!workout || !userId) return;
    const oldKey = normalizeExerciseKey(exercisesObject[key]?.variant ?? "");
    const newKey = normalizeExerciseKey(variant);
    if (oldKey && oldKey !== newKey) {
      // Commit any in-memory sets to Firestore under the old key before we touch history.
      await flushKey(key, exercisesObject);
      // Remove only this workout's sets from the old key — prior workouts' lifts must stay.
      // (Don't use migrateExerciseHistory here: that would move the entire lifetime history,
      // which is wrong when the user is swapping exercises rather than correcting a typo.)
      const workoutDateStr =
        workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      const sets = (exercisesObject[key]?.sets ?? [])
        .filter((s) => s.weightkg > 0 && s.reps > 0)
        .map((s) => ({ weight: s.weightkg, reps: s.reps, date: workoutDateStr }));
      await FirestoreActions.removeExerciseSetsFromHistory(userId, oldKey, sets);
    }
    const updated: ExerciseMap = { ...exercisesObject };
    const patch: Partial<Exercise> = { name, variant };
    if (customExerciseId !== undefined) patch.customExerciseId = customExerciseId;
    else delete updated[key].customExerciseId;
    updated[key] = { ...updated[key], ...patch };
    saveExercises(updated);
    if (oldKey !== newKey && newKey) {
      // Queue a write of this workout's sets under the new key so they land in history.
      const workoutDateStr =
        workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      scheduleWrite(key, updated, workoutDateStr, workoutId);
    }
  }

  async function closeHandler(key: string) {
    if (!workout || !userId) return;

    const exercise = exercisesObject[key];
    const firestoreKey = normalizeExerciseKey(exercise?.variant ?? "");
    const workoutDateStr =
      workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const sets = (exercise?.sets ?? [])
      .filter((s) => s.weightkg > 0 && s.reps > 0)
      .map((s) => ({ weight: s.weightkg, reps: s.reps, date: workoutDateStr }));

    const updatedExercises: ExerciseMap = { ...exercisesObject };
    delete updatedExercises[key];
    saveExercises(updatedExercises);

    if (!firestoreKey) return;

    const duplicateEntry = Object.entries(updatedExercises).find(
      ([, ex]) => normalizeExerciseKey(ex.variant) === firestoreKey,
    );

    if (duplicateEntry) {
      scheduleWrite(duplicateEntry[0], updatedExercises, workoutDateStr, workoutId);
    } else {
      cancelKey(firestoreKey);
      await FirestoreActions.removeExerciseSetsFromHistory(userId, firestoreKey, sets);
    }
  }

  function addNewExercise(): string | null {
    if (!workout) return null;
    const key = `exercise_${Date.now()}`;
    const updated: ExerciseMap = {
      ...exercisesObject,
      [key]: { ...EMPTY_EXERCISE, order: Object.keys(exercisesObject).length },
    };
    saveExercises(updated);
    return key;
  }

  function onDateChange(date: Date) {
    if (!workout) return;
    saveWorkout(
      exerciseMapToWorkout(exercisesObject, Timestamp.fromDate(date), workout.durationSeconds),
    );
  }

  return {
    workout,
    exercisesObject,
    onSetsChange,
    exerciseNameChangeHandler,
    closeHandler,
    addNewExercise,
    onDateChange,
  };
}
