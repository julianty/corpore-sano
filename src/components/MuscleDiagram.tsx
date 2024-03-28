import React, { useEffect } from "react";
import { useState } from "react";
import FrontMuscles from "../assets/FrontMuscles";
import { Box, Group, Stack, Title, Text } from "@mantine/core";
import BackMuscles from "../assets/BackMuscles";
import { FirestoreActions } from "./FirestoreActions";
import { useAppSelector } from "../hooks";
import { MuscleSummary, Workout } from "../types";
import { muscleGroups as muscleGroupsData } from "../data/muscleGroups";
import exerciseCatalog from "../data/exerciseCatalog";
export function MuscleDiagram() {
  const [activeMuscle, setActiveMuscle] = useState("");
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleSummary>({});
  const userId = useAppSelector((state) => state.auth.userId);

  // Query database to find workouts from this past week
  useEffect(() => {
    function getMondayDate() {
      const today = new Date();
      const mondayDate = new Date();
      const mSecPerDay = 86400000;
      mondayDate.setTime(today.getTime() - (today.getDay() - 1) * mSecPerDay);
      mondayDate.setHours(0, 0, 0);
      return mondayDate;
    }
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

  function onMouseEnterHandler(e: React.MouseEvent<SVGElement>) {
    // Captures mouse enter events to set activeMuscle state
    const target = e.target as HTMLElement;
    const parentElement = target.parentElement!;
    setActiveMuscle(parentElement.id);
  }
  const svgProps = {
    width: "200px",
    height: "500px",
    onMouseEnterHandler: onMouseEnterHandler,
  };

  return (
    <Stack>
      <Title order={2}>Body Diagram</Title>
      <Box w="100%" h="500px">
        <Group grow>
          <Box className="muscles-front">
            <FrontMuscles {...svgProps} />
          </Box>
          <Box className="muscles-back">
            <BackMuscles {...svgProps} />
          </Box>
        </Group>
      </Box>
      <Text>{`You are currently hovering over ${activeMuscle}`}</Text>
    </Stack>
  );
}
