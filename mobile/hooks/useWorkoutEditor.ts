import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { Workout, Exercise, ExerciseMap, SetEntry } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { normalizeExerciseKey } from "@shared/core/services/exerciseHistory";
import { useExerciseHistoryWriter } from "./useExerciseHistoryWriter";

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: [],
};

function workoutToExerciseMap(workout: Workout): ExerciseMap {
  return Object.fromEntries(
    Object.entries(workout)
      .filter(([k]) => k !== "date")
      .map(([k, v]) => {
        const ex = v as Exercise;
        return [k, Array.isArray(ex.sets) ? ex : { ...ex, sets: [] }];
      }),
  ) as ExerciseMap;
}

export function useWorkoutEditor(userId: string | null, workoutId: string) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const { scheduleWrite, flushKey, cancelKey } = useExerciseHistoryWriter(
    userId,
    workoutId,
  );

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

  function onSetsChange(key: string, sets: SetEntry[]) {
    if (!workout) return;
    const updated: ExerciseMap = { ...exercisesObject, [key]: { ...exercisesObject[key], sets } };
    saveWorkout({ ...workout, ...updated });
    const workoutDateStr =
      workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    scheduleWrite(key, updated, workoutDateStr);
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
      await flushKey(key, exercisesObject);
    }
    const updated: ExerciseMap = { ...exercisesObject };
    const patch: Partial<Exercise> = { name, variant };
    if (customExerciseId !== undefined) patch.customExerciseId = customExerciseId;
    else delete updated[key].customExerciseId;
    updated[key] = { ...updated[key], ...patch };
    saveWorkout({ ...workout, ...updated });
    if (oldKey && newKey && oldKey !== newKey) {
      await FirestoreActions.migrateExerciseHistory(userId, oldKey, newKey, name);
    }
  }

  async function closeHandler(key: string) {
    if (!workout || !userId) return;

    const exercise = exercisesObject[key];
    const firestoreKey = normalizeExerciseKey(exercise?.variant ?? "");

    const updatedExercises: ExerciseMap = { ...exercisesObject };
    delete updatedExercises[key];

    const updated = { ...workout };
    delete (updated as Record<string, unknown>)[key];
    saveWorkout(updated);

    if (!firestoreKey) return;

    const duplicateEntry = Object.entries(updatedExercises).find(
      ([, ex]) => normalizeExerciseKey(ex.variant) === firestoreKey,
    );

    if (duplicateEntry) {
      const workoutDateStr =
        workout.date?.toDate().toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      scheduleWrite(duplicateEntry[0], updatedExercises, workoutDateStr);
    } else {
      cancelKey(firestoreKey);
      await FirestoreActions.removeWorkoutLiftsFromHistory(
        userId,
        firestoreKey,
        workoutId,
      );
    }
  }

  function addNewExercise(): string | null {
    if (!workout) return null;
    const key = `exercise_${Date.now()}`;
    const updated: ExerciseMap = {
      ...exercisesObject,
      [key]: { ...EMPTY_EXERCISE, order: Object.keys(exercisesObject).length },
    };
    saveWorkout({ ...workout, ...updated });
    return key;
  }

  function onDateChange(date: Date) {
    if (!workout) return;
    saveWorkout({ ...workout, date: Timestamp.fromDate(date) });
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
