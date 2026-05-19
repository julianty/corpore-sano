import { useCallback, useEffect, useRef } from "react";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import {
  computeStats,
  ExerciseHistoryDoc,
  mergeLifts,
  normalizeExerciseKey,
} from "../core/services/exerciseHistory";
import { Exercise, ExerciseMap } from "../types";

export default function useExerciseHistoryWriter() {
  const userId = useAppSelector((state) => state.auth.userId);
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  });
  const timersRef = useRef<
    Record<
      string,
      { timerId: ReturnType<typeof setTimeout>; write: () => Promise<void> }
    >
  >({});

  const flushAll = useCallback(async () => {
    // Used for when app is unmounted or whenever all pending debounces should be written
    // Loop through all the timers and write
    Object.entries(timersRef.current).forEach(
      async ([firestoreKey, { timerId, write }]) => {
        clearTimeout(timerId);
        delete timersRef.current[firestoreKey];
        await write();
      },
    );
  }, []);

  useEffect(() => {
    const visibilityChangeHander = () => {
      if (document.visibilityState == "hidden") flushAll();
    };
    document.addEventListener("visibilitychange", visibilityChangeHander);
    return () => {
      // Remove listener
      document.removeEventListener("visibilitychange", visibilityChangeHander);
      // Flush on cleanup
      flushAll();
    };
  }, [flushAll]);

  const updateFirestore = async (
    exercises: ExerciseMap,
    exercise: Exercise,
    firestoreKey: string,
    workoutDateStr: string,
  ) => {
    if (!userIdRef.current) return;

    // Get the sets of the exercise that matches firestoreKey
    const allSessionSets = Object.values(exercises)
      .filter((ex) => normalizeExerciseKey(ex.variant) === firestoreKey)
      .flatMap((ex) => ex.sets);

    // Map the sets found to the shape {weight:, reps:, date:}
    const liftsToWrite = allSessionSets
      .filter((s) => s.weightkg > 0 && s.reps > 0)
      .map((s) => ({ weight: s.weightkg, reps: s.reps, date: workoutDateStr }));

    if (liftsToWrite.length == 0) return;

    // Try merging the existing history
    try {
      const existing = await FirestoreActions.fetchExerciseHistory(
        userIdRef.current,
        firestoreKey,
      );
      const storedLifts = existing?.allLifts ?? [];
      const merged = mergeLifts(storedLifts, liftsToWrite, workoutDateStr);
      const computed = computeStats(merged);

      const doc: ExerciseHistoryDoc = {
        exerciseName: exercise.name,
        allLifts: merged,
        computed,
      };

      await FirestoreActions.upsertExerciseHistory(
        userIdRef.current,
        firestoreKey,
        doc,
      );
    } catch (e) {
      console.error("[useExerciseHistoryWriter] upsert failed:", e);
    }
  };

  const scheduleWrite = async (
    exerciseUUID: string,
    exercises: ExerciseMap,
    workoutDateStr: string,
  ) => {
    // unpack params
    const exercise = exercises[exerciseUUID];
    if (!exercise) return;

    // Get normalized key
    const firestoreKey = normalizeExerciseKey(exercise.variant);

    // Schedule a write to firestore -- user's exercise history
    if (timersRef.current[firestoreKey]) {
      // There's an active timer, so cancel it, we re-set it in the next lines
      clearTimeout(timersRef.current[firestoreKey].timerId);
    }

    timersRef.current[firestoreKey] = {
      timerId: setTimeout(async () => {
        //  This runs at the end of the timer
        delete timersRef.current[firestoreKey];
        updateFirestore(exercises, exercise, firestoreKey, workoutDateStr);
      }, 30000),
      // The write function is called when flush is triggered
      write: () =>
        updateFirestore(exercises, exercise, firestoreKey, workoutDateStr),
    };
    //
  };

  // Flush a single pending write for a specific exercise UUID.
  // Used before renaming an exercise so the old key's history is committed first.
  const flushKey = async (exerciseUUID: string, exercises: ExerciseMap) => {
    const exercise = exercises[exerciseUUID];
    if (!exercise) return;
    const firestoreKey = normalizeExerciseKey(exercise.variant);
    if (!firestoreKey) return;
    const pending = timersRef.current[firestoreKey];
    if (!pending) return;
    clearTimeout(pending.timerId);
    delete timersRef.current[firestoreKey];
    await pending.write();
  };

  const cancelKey = (firestoreKey: string) => {
    const pending = timersRef.current[firestoreKey];
    if (!pending) return;
    clearTimeout(pending.timerId);
    delete timersRef.current[firestoreKey];
  };
  return { scheduleWrite, flushKey, flushAll, cancelKey };
}
