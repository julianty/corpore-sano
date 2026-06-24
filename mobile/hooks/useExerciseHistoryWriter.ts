import { useCallback, useEffect, useRef } from "react";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import {
  normalizeExerciseKey,
  mergeLifts,
  computeStats,
} from "@shared/core/services/exerciseHistory";
import type { ExerciseHistoryDoc } from "@shared/core/services/exerciseHistory";
import type { Exercise, ExerciseMap } from "@shared/types";
import { AppState } from "react-native";

export function useExerciseHistoryWriter(
  userId: string | null,
  workoutId: string,
) {
  const userIdRef = useRef(userId);
  const timersRef = useRef<
    Record<string, { timerId: number; write: () => Promise<void> }>
  >({});

  useEffect(() => {
    userIdRef.current = userId;
  });

  const updateFirestore = useCallback(
    async (
      exercises: ExerciseMap,
      exercise: Exercise,
      firestoreKey: string,
      workoutDateStr: string,
    ) => {
      const uid = userIdRef.current;
      if (!uid) return;

      const allSessionSets = Object.values(exercises)
        .filter((ex) => normalizeExerciseKey(ex.variant) === firestoreKey)
        .flatMap((ex) => ex.sets);

      const liftsToWrite = allSessionSets
        .filter((s) => s.weightkg > 0 && s.reps > 0)
        .map((s) => ({
          weight: s.weightkg,
          reps: s.reps,
          date: workoutDateStr,
          workoutId,
        }));

      if (liftsToWrite.length === 0) return;

      try {
        const existing = await FirestoreActions.fetchExerciseHistory(
          uid,
          firestoreKey,
        );
        const storedLifts = existing?.allLifts ?? [];
        const merged = mergeLifts(storedLifts, liftsToWrite, workoutId);
        const computed = computeStats(merged);

        const doc: ExerciseHistoryDoc = {
          exerciseName: exercise.name,
          allLifts: merged,
          computed,
        };

        await FirestoreActions.upsertExerciseHistory(uid, firestoreKey, doc);
      } catch (e) {
        console.error("[useExerciseHistoryWriter] upsert failed:", e);
      }
    },
    [workoutId],
  );

  const scheduleWrite = useCallback(
    async (exerciseUUID: string, exercises: ExerciseMap, workoutDateStr: string) => {
      const uid = userIdRef.current;
      if (!uid) return;

      const exercise = exercises[exerciseUUID];
      if (!exercise) return;

      const firestoreKey = normalizeExerciseKey(exercise.variant);
      if (!firestoreKey) return;

      if (timersRef.current[firestoreKey]) {
        clearTimeout(timersRef.current[firestoreKey].timerId);
      }

      timersRef.current[firestoreKey] = {
        timerId: setTimeout(async () => {
          delete timersRef.current[firestoreKey];
          await updateFirestore(exercises, exercise, firestoreKey, workoutDateStr);
        }, 30_000),
        write: () => updateFirestore(exercises, exercise, firestoreKey, workoutDateStr),
      };
    },
    [updateFirestore],
  );

  // Flush a single pending write for a specific exercise UUID.
  // Used before renaming an exercise so the old key's history is committed first.
  const flushKey = useCallback(
    async (exerciseUUID: string, exercises: ExerciseMap) => {
      const exercise = exercises[exerciseUUID];
      if (!exercise) return;
      const firestoreKey = normalizeExerciseKey(exercise.variant);
      if (!firestoreKey) return;
      const pending = timersRef.current[firestoreKey];
      if (!pending) return;
      clearTimeout(pending.timerId);
      delete timersRef.current[firestoreKey];
      await pending.write();
    },
    [],
  );

  const cancelKey = useCallback((firestoreKey: string) => {
    const pending = timersRef.current[firestoreKey];
    if (!pending) return;
    clearTimeout(pending.timerId);
    delete timersRef.current[firestoreKey];
  }, []);

  // Function to clear out pending writes
  const flushAll = useCallback(() => {
    Object.entries(timersRef.current).forEach(
      async ([key, { timerId, write }]) => {
        clearTimeout(timerId);
        delete timersRef.current[key];
        await write();
      },
    );
  }, []);

  // Add a subscription to App state to flush pending writes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (["background", "inactive"].includes(state)) {
        flushAll();
      }
    });
    return () => {
      // fire on unmount
      subscription.remove();
      flushAll();
    };
  }, [flushAll]);
  return { scheduleWrite, flushKey, cancelKey, flushAll };
}
