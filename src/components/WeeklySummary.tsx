import { Group, Paper, Title, Text, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { Muscle, MuscleSummary, Workout } from "../types";
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

export default function WeeklySummary() {
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const [muscleGroups, setMuscleGroups] =
    useState<MuscleSummary>(muscleGroupsData);
  const userId = useAppSelector((state) => state.auth.userId);
  const [workedMuscles, setWorkedMuscles] = useState<Array<Muscle>>([]);
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

  // Populate the muscleGroups object
  useEffect(() => {
    setMuscleGroups(muscleGroupsData);
    const newMuscleGroups: MuscleSummary = { ...muscleGroups };
    workoutArray.forEach((workout) => {
      Object.entries(workout).forEach(([key, exerciseObj]) => {
        if (key === "date") return;
        const sets = exerciseObj.sets;
        const reps = exerciseObj.reps;
        const weight = exerciseObj.weight;
        const muscles = exerciseCatalog.data.filter(
          (exercise) => exercise.name === exerciseObj.name
        )[0].muscles;
        muscles.forEach((muscleName) => {
          newMuscleGroups[muscleName]["sets"] += sets;
          newMuscleGroups[muscleName]["weightTotal"]! += sets * reps * weight;
        });
      });
    });
    // Picks out muscles that have any sets this week
    setWorkedMuscles(
      Object.values(muscleGroups).filter((muscle) => {
        return muscle.sets! > 0 ? 1 : 0;
      })
    );
  }, [workoutArray, muscleGroups]);

  // const workedMuscles = useMemo(() => {
  //   return Object.values(muscleGroups).filter((muscle) => {
  //     return muscle.sets! > 0 ? 1 : 0;
  //   });
  // }, [muscleGroups]);
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
            {parentGroups.map((group) => (
              <Table.Tr key={group}>
                <Table.Td>{group}</Table.Td>
                <Table.Td>{0}</Table.Td>
                <Table.Td>{"2 days ago"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
      <Paper {...paperStyle}>
        <Title order={5}>Muscles Worked</Title>
        {workedMuscles.map((muscle) => {
          return <Text key={`workedMuscle${muscle.name}`}>{muscle.name}</Text>;
        })}
      </Paper>
    </Group>
  );
}
