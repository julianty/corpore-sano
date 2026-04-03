import { Group } from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import { Workout, WorkoutEntry } from "../../types";
import { useAppSelector } from "../../hooks";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import {
  getByDaysElapsed,
  calculateDaysBetweenDates,
} from "../../helperFunctions/DateHelper";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import { createExerciseMap } from "../../utils/exerciseLookup";
import {
  buildMuscleSummary,
  rollupToParentGroups,
  ParentGroupSummary,
} from "../../core/services/muscleCalculations";
import { MuscleGroupTable } from "./MuscleGroupTable";
import { WorkoutActivityTracker } from "./WorkoutActivityTracker";

const exerciseCatalog = exerciseCatalogUpdated;

const emptyParentGroups: ParentGroupSummary = {
  Shoulders: { sets: 0 },
  Back: { sets: 0 },
  Chest: { sets: 0 },
  Arms: { sets: 0 },
  Core: { sets: 0 },
  Legs: { sets: 0 },
};

export default function WeeklySummary() {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [parentMuscleGroupsNumSets, setParentMuscleGroupsNumSets] =
    useState<ParentGroupSummary>(emptyParentGroups);

  const exerciseMap = useMemo(
    () => createExerciseMap(exerciseCatalog.data),
    [],
  );

  useEffect(() => {
    const targetDate = getByDaysElapsed(21);
    FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then(
      (entries) => {
        setWorkoutEntries(entries);
      },
    );
  }, [userId]);

  useEffect(() => {
    const workoutArray = workoutEntries.map((e) => e.data as Workout);
    const getDaysSince = (date: Date) =>
      calculateDaysBetweenDates(date, new Date());
    const muscleSummary = buildMuscleSummary(
      workoutArray,
      exerciseMap,
      getDaysSince,
      7,
    );
    setParentMuscleGroupsNumSets(rollupToParentGroups(muscleSummary));
  }, [workoutEntries, exerciseMap]);

  return (
    <Group align="flex-start">
      <MuscleGroupTable parentMuscleGroupsNumSets={parentMuscleGroupsNumSets} />
      <WorkoutActivityTracker workoutEntries={workoutEntries} />
    </Group>
  );
}
