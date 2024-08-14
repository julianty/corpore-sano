import { Group, Paper, Title, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { MuscleSummary, Workout } from "../types";
import {
  muscleGroups as muscleGroupsData,
  parentGroups,
} from "../data/muscleGroups";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import {
  calculateDaysBetweenDates,
  getByDaysElapsed,
} from "../helperFunctions/DateHelper";
// import exerciseCatalog from "../data/exerciseCatalog";
import exerciseCatalogUpdated from "../data/exerciseCatalogUpdated";

const exerciseCatalog = exerciseCatalogUpdated;
const paperStyle = {
  p: "md",
  withBorder: true,
};
interface MuscleGroupsSets {
  [name: string]: { sets: number; daysSinceLast?: number };
}
export default function WeeklySummary() {
  // Workout array stores the workouts from the past week
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

  // On render and whenever the userId changes,
  // Query database to find workouts from this past week
  useEffect(() => {
    // By default, get the workouts from seven days ago
    const targetDate = getByDaysElapsed(7);
    // Fetch the workouts that have been completed after the target date
    FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then(
      (workoutArray) => {
        setWorkoutArray(workoutArray.map((workout) => workout as Workout));
      }
    );
  }, [userId]);

  // On render and whenever workoutArray changes,
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
      // Calculate the number of days it has been since the workout
      const daysSinceWorkout = calculateDaysBetweenDates(
        workout.date!.toDate(),
        new Date()
      );
      Object.entries(workout).forEach(([key, value]) => {
        if (key === "date") return;
        const sets = value.sets;
        const reps = value.reps;
        const weight = value.weight;
        // Check if the exercise exists in the exerciseCatalog
        try {
          if (
            exerciseCatalog.data.filter(
              (exercise) => exercise.name === value.name
            ).length === 0
          ) {
            throw new Error(
              `Exercise: ${value.name} not found in exerciseCatalog`
            );
          } else {
            // Search for the muscles invloved in each exercise.name in the exerciseCatalog
            const muscles = exerciseCatalog.data.filter(
              (exercise) => exercise.name === value.name
            )[0].muscles;
            // For each of these muscles involved, update the muscleGroups object
            muscles.forEach((muscleName) => {
              muscleGroups[muscleName]["sets"] += sets;
              muscleGroups[muscleName]["weightTotal"]! += sets * reps * weight;
              muscleGroups[muscleName]["lastWorked"] = daysSinceWorkout;
            });
          }
        } catch (error) {
          console.error(error);
          return;
        }
      });
    });

    // Initialize object containing the worked parent muscle groups
    // e.g. (Shoulders, Back, Chest, Arms, Core, Legs)
    const newParentMuscleGroupsNumSets: MuscleGroupsSets = {
      Shoulders: { sets: 0 },
      Back: { sets: 0 },
      Chest: { sets: 0 },
      Arms: { sets: 0 },
      Core: { sets: 0 },
      Legs: { sets: 0 },
    };

    // Loop through each of the subcategories of muscle groups and
    // update the parent muscle groups with the sets and days since last worked
    Object.values(muscleGroups).forEach((muscleObj) => {
      if (muscleObj.sets === 0) return;
      const lastWorked =
        muscleObj.lastWorked !== undefined ? muscleObj.lastWorked : 8;

      if (
        newParentMuscleGroupsNumSets[muscleObj.parentGroup].daysSinceLast !==
        undefined
      ) {
        newParentMuscleGroupsNumSets[muscleObj.parentGroup].daysSinceLast =
          Math.min(
            newParentMuscleGroupsNumSets[muscleObj.parentGroup].daysSinceLast!,
            lastWorked
          );
      }
      newParentMuscleGroupsNumSets[muscleObj.parentGroup] = {
        sets:
          newParentMuscleGroupsNumSets[muscleObj.parentGroup].sets +
          muscleObj.sets,
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
              let daysSinceLast =
                parentMuscleGroupsNumSets[group].daysSinceLast! >= 7
                  ? `7+`
                  : parentMuscleGroupsNumSets[group].daysSinceLast;
              if (daysSinceLast === undefined) daysSinceLast = "7+";
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
