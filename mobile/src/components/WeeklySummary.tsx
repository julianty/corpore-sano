import { useEffect, useState, useMemo } from "react";
import { ScrollView } from "react-native";
import { DataTable, Text, Card, ActivityIndicator } from "react-native-paper";

import { Workout } from "@shared/types";
import { parentGroups } from "@shared/data/muscleGroups";
import { useAppSelector } from "@shared/hooks";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import {
  getByDaysElapsed,
  calculateDaysBetweenDates,
} from "@shared/helperFunctions/DateHelper";
import exerciseCatalogUpdated from "@shared/data/exerciseCatalogUpdated";
import { createExerciseMap } from "@shared/utils/exerciseLookup";
import {
  buildMuscleSummary,
  rollupToParentGroups,
  ParentGroupSummary,
} from "@shared/core/services/muscleCalculations";

const exerciseCatalog = exerciseCatalogUpdated;

export function WeeklySummary() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workoutArray, setWorkoutArray] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentGroups_, setParentGroups] = useState<ParentGroupSummary>({
    Shoulders: { sets: 0 },
    Back: { sets: 0 },
    Chest: { sets: 0 },
    Arms: { sets: 0 },
    Core: { sets: 0 },
    Legs: { sets: 0 },
  });

  const exerciseMap = useMemo(
    () => createExerciseMap(exerciseCatalog.data),
    [],
  );

  useEffect(() => {
    const targetDate = getByDaysElapsed(7);
    FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then((data) => {
      setWorkoutArray(data.map((w) => w as Workout));
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    const getDaysSince = (date: Date) =>
      calculateDaysBetweenDates(date, new Date());
    const summary = buildMuscleSummary(workoutArray, exerciseMap, getDaysSince);
    setParentGroups(rollupToParentGroups(summary));
  }, [workoutArray, exerciseMap]);

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <Card style={{ margin: 16 }}>
      <Card.Title title="Muscle Groups This Week" />
      <Card.Content>
        <ScrollView horizontal>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ width: 110 }}>Group</DataTable.Title>
              <DataTable.Title numeric style={{ width: 110 }}>
                Sets
              </DataTable.Title>
              <DataTable.Title style={{ width: 130 }}>
                Last Worked
              </DataTable.Title>
            </DataTable.Header>
            {parentGroups.map((group) => {
              const data = parentGroups_[group];
              const last =
                data.daysSinceLast === undefined
                  ? "7+ days ago"
                  : data.daysSinceLast >= 7
                    ? "7+ days ago"
                    : `${data.daysSinceLast} days ago`;
              return (
                <DataTable.Row key={group}>
                  <DataTable.Cell style={{ width: 110 }}>
                    {group}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ width: 110 }}>
                    {data.sets}
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: 130 }}>
                    <Text variant="bodySmall">{last}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}
