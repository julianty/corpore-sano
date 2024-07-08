import { Group, Paper, Title, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { MuscleSummary, Workout } from "../types";
import {
  muscleGroups as muscleGroupsData,
  parentGroups,
} from "../data/muscleGroups";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { getByDaysElapsed } from "../helperFunctions/DateHelper";
import exerciseCatalog from "../data/exerciseCatalog";

const paperStyle = {
  p: "md",
  withBorder: true,
};
interface MuscleGroupsSets {
  [name: string]: { sets: number; daysSinceLast?: number };
}
export default function WeeklySummary() {
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [parentMuscleGroupsNumSets, setParentMuscleGroupsNumSets] =
    useState<MuscleGroupsSets>({
      Shoulders: { sets: 0 },
      Back: { sets: 0 },
      Chest: { sets: 0 },
      Arms: { sets: 0 },
      Core: { sets: 0 },
      Legs: { sets: 0 },
    });

  // Query database to find workouts from this past week
  useEffect(() => {
    // By default, get the workouts from seven days ago
    const targetDate = getByDaysElapsed(7);
    FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then(
      (workoutArray) => {
        setWorkoutArray(workoutArray.map((workout) => workout as Workout));
      }
    );
  }, [userId]);

  useEffect(() => {
    // Update the muscleGroups object with data from Firebase via workoutArray
    const muscleGroups: MuscleSummary = {};
    Object.values(muscleGroupsData).forEach((muscle) => {
      muscleGroups[muscle.name] = {
        name: muscle.name,
        sets: 0,
        weightTotal: 0,
        parentGroup: muscle.parentGroup,
      };
    });
    workoutArray.forEach((workout) => {
      // const daysSinceWorkout = workout.date
      const daysSinceWorkout = 1;
      Object.entries(workout).forEach(([key, value]) => {
        if (key === "date") return;
        const sets = value.sets;
        const reps = value.reps;
        const weight = value.weight;
        const muscles = exerciseCatalog.data.filter(
          (exercise) => exercise.name === value.name
        )[0].muscles;
        muscles.forEach((muscleName) => {
          muscleGroups[muscleName]["sets"] += sets;
          muscleGroups[muscleName]["weightTotal"]! += sets * reps * weight;
          muscleGroups[muscleName].lastWorked = daysSinceWorkout;
        });
      });
    });

    // Set the worked parent muscle groups
    const newParentMuscleGroupsNumSets: MuscleGroupsSets = {};
    Object.values(muscleGroups).forEach((muscleObj) => {
      const lastWorked =
        muscleObj.lastWorked !== undefined ? muscleObj.lastWorked : -1;
      newParentMuscleGroupsNumSets[muscleObj.parentGroup] = {
        sets: muscleObj.sets,
        daysSinceLast: lastWorked,
      };
    });

    setParentMuscleGroupsNumSets(newParentMuscleGroupsNumSets);
  }, [workoutArray]);

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
              const daysSinceLast =
                parentMuscleGroupsNumSets[group].daysSinceLast! < 0
                  ? `7+`
                  : parentMuscleGroupsNumSets[group].daysSinceLast;
              return (
                <Table.Tr key={group}>
                  <Table.Td>{group}</Table.Td>
                  <Table.Td>{parentMuscleGroupsNumSets[group].sets}</Table.Td>
                  <Table.Td>{`${daysSinceLast} days ago`}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Group>
  );
}
