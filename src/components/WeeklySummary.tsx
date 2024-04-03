import { Group, Paper, Title, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { MuscleSummary, Workout } from "../types";
import { muscleGroups as muscleGroupsData } from "../data/muscleGroups";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { getMondayDate } from "../helperFunctions/getMondayDate";
import exerciseCatalog from "../data/exerciseCatalog";

export default function WeeklySummary() {
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const [muscleGroups, setMuscleGroups] =
    useState<MuscleSummary>(muscleGroupsData);
  const userId = useAppSelector((state) => state.auth.userId);

  // Query database to find workouts from this past week
  useEffect(() => {
    const mondayDate = getMondayDate();
    FirestoreActions.fetchWorkoutsAfterDate(userId, mondayDate).then(
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
          // console.log(sets);
          newMuscleGroups[muscleName]["sets"] += sets;
          newMuscleGroups[muscleName]["weightTotal"]! += sets * reps * weight;
        });
      });
    });
  }, [workoutArray, muscleGroups]);

  // Picks out muscles that have any sets this week
  const workedMuscles = Object.values(muscleGroups).filter((muscle) => {
    return muscle.sets! > 0 ? 1 : 0;
  });
  console.log(workedMuscles);
  return (
    <Paper>
      <Group>
        <Paper>
          <Title order={5}>Muscles below MEV</Title>
          {workedMuscles.map((muscle) => {
            return (
              <Text key={`workedMuscle${muscle.name}`}>{muscle.name}</Text>
            );
          })}
        </Paper>
        <Paper>
          <Title order={5}>Muscles above MRV</Title>
        </Paper>
      </Group>
    </Paper>
  );
}
