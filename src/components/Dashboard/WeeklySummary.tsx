import { Group, Paper, Title, Table } from "@mantine/core";
import { useEffect, useState, useMemo } from "react";
import { Workout } from "../../types";
import { parentGroups } from "../../data/muscleGroups";
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
  getLastWorkedFreshness,
  ParentGroupSummary,
} from "../../core/services/muscleCalculations";

const exerciseCatalog = exerciseCatalogUpdated;

const freshnessColor = {
  fresh: "var(--mantine-color-green-6)",
  moderate: "var(--mantine-color-yellow-6)",
  stale: "var(--mantine-color-orange-6)",
} as const;

const paperStyle = {
  p: "md",
  withBorder: true,
};

export default function WeeklySummary() {
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [parentMuscleGroupsNumSets, setParentMuscleGroupsNumSets] =
    useState<ParentGroupSummary>({
      Shoulders: { sets: 0 },
      Back: { sets: 0 },
      Chest: { sets: 0 },
      Arms: { sets: 0 },
      Core: { sets: 0 },
      Legs: { sets: 0 },
    });

  // Static catalog map — created once
  const exerciseMap = useMemo(
    () => createExerciseMap(exerciseCatalog.data),
    [],
  );

  useEffect(() => {
    const targetDate = getByDaysElapsed(21);
    FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then(
      (workoutArray) => {
        setWorkoutArray(workoutArray.map((workout) => workout as Workout));
      },
    );
  }, [userId]);

  useEffect(() => {
    const getDaysSince = (date: Date) =>
      calculateDaysBetweenDates(date, new Date());
    const muscleSummary = buildMuscleSummary(
      workoutArray,
      exerciseMap,
      getDaysSince,
      7,
    );
    setParentMuscleGroupsNumSets(rollupToParentGroups(muscleSummary));
  }, [workoutArray, exerciseMap]);

  return (
    <Group align="flex-start">
      <Paper {...paperStyle}>
        <Title order={5}>Muscle Groups</Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Group</Table.Th>
              <Table.Th>Sets this week</Table.Th>
              <Table.Th>Last Worked</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {parentGroups.map((group) => {
              const data = parentMuscleGroupsNumSets[group];
              const raw = data.daysSinceLast;
              const freshness = getLastWorkedFreshness(raw);
              let label: string;
              if (raw === undefined) {
                label = "—";
              } else if (raw === 0) {
                label = "Today";
              } else {
                label = `${raw} days ago`;
              }
              return (
                <Table.Tr key={group}>
                  <Table.Td>{group}</Table.Td>
                  <Table.Td>{data.sets}</Table.Td>
                  <Table.Td
                    style={{
                      color: freshnessColor[freshness],
                      fontWeight: freshness === "stale" ? 700 : undefined,
                    }}
                  >
                    {label}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Group>
  );
}
