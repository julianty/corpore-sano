import { useCallback, useEffect, useRef } from "react";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import {
  normalizeExerciseKey,
  mergeLifts,
  computeStats,
} from "@shared/core/services/exerciseHistory";
import type { ExerciseHistoryDoc } from "@shared/core/services/exerciseHistory";
import type { ExerciseMap } from "@shared/types";

export function useExerciseHistoryWriter(userId: string | null) {
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  });

  const scheduleWrite = useCallback(
    async (exerciseUUID: string, exercises: ExerciseMap) => {
      const uid = userIdRef.current;
      if (!uid) return;

      const exercise = exercises[exerciseUUID];
      if (!exercise) return;

      const firestoreKey = normalizeExerciseKey(exercise.variant);
      if (!firestoreKey) return;

      const todayStr = new Date().toISOString().slice(0, 10);

      const allSessionSets = Object.values(exercises)
        .filter((ex) => normalizeExerciseKey(ex.variant) === firestoreKey)
        .flatMap((ex) => ex.sets);

      const liftsToWrite = allSessionSets
        .filter((s) => s.weightkg > 0 && s.reps > 0)
        .map((s) => ({ weight: s.weightkg, reps: s.reps, date: todayStr }));

      if (liftsToWrite.length === 0) return;

      try {
        const existing = await FirestoreActions.fetchExerciseHistory(
          uid,
          firestoreKey,
        );
        const storedLifts = existing?.allLifts ?? [];
        const merged = mergeLifts(storedLifts, liftsToWrite, todayStr);
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
    [],
  );

  return { scheduleWrite };
}
