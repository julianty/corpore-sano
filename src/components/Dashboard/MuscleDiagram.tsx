import React, { useEffect, useMemo } from "react";
import { useState } from "react";
import FrontMuscles from "../../assets/FrontMuscles";
import { Box, Group, Stack, Title, Text } from "@mantine/core";
import BackMuscles from "../../assets/BackMuscles";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { useAppSelector } from "../../hooks";
import { MuscleSummary, Workout } from "../../types";
import { muscleGroups as muscleGroupsData } from "../../data/muscleGroups";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import {
  getMondayDate,
  calculateDaysBetweenDates,
} from "../../helperFunctions/DateHelper";
import { responsiveDimensions } from "../../styles/responsive";
import { createExerciseMap } from "../../utils/exerciseLookup";
import { buildMuscleSummary } from "../../core/services/muscleCalculations";

const exerciseCatalog = exerciseCatalogUpdated;

export function MuscleDiagram() {
  const [activeMuscle, setActiveMuscle] = useState("");
  const [workoutArray, setWorkoutArray] = useState<Array<Workout>>([]);
  const [muscleGroups, setMuscleGroups] =
    useState<MuscleSummary>(muscleGroupsData);
  const userId = useAppSelector((state) => state.auth.userId);

  // Static catalog map — created once
  const exerciseMap = useMemo(
    () => createExerciseMap(exerciseCatalog.data),
    [],
  );

  useEffect(() => {
    const mondayDate = getMondayDate();
    FirestoreActions.fetchWorkoutsAfterDate(userId, mondayDate).then(
      (entries) => {
        setWorkoutArray(entries.map((entry) => entry.data as Workout));
      },
    );
  }, [userId]);

  useEffect(() => {
    const getDaysSince = (date: Date) =>
      calculateDaysBetweenDates(date, new Date());
    const summary = buildMuscleSummary(workoutArray, exerciseMap, getDaysSince);
    setMuscleGroups({ ...muscleGroupsData, ...summary });
  }, [workoutArray, exerciseMap]);

  function onMouseEnterHandler(e: React.MouseEvent<SVGElement>) {
    // Captures mouse enter events to set activeMuscle state
    const target = e.target as HTMLElement;
    const parentElement = target.parentElement!;
    setActiveMuscle(parentElement.id);
  }
  const svgProps = {
    width: "100%",
    height: responsiveDimensions.muscleChartHeight.md,
    onMouseEnterHandler: onMouseEnterHandler,
  };

  return (
    <Stack>
      <Title order={2}>Body Diagram</Title>
      <Box w="100%" h={responsiveDimensions.muscleChartHeight.md}>
        <Group grow>
          <Box className="muscles-front">
            <FrontMuscles {...svgProps} />
          </Box>
          <Box className="muscles-back">
            <BackMuscles {...svgProps} />
          </Box>
        </Group>
      </Box>
      {/* <Text>{`You are currently hovering over ${activeMuscle} of which you have done ${
              muscleGroups[activeMuscle].sets !== undefined
                ? 0
                : muscleGroups[activeMuscle].sets
            } sets with this week`}</Text> */}
      <Text>{`You are currently hovering over ${activeMuscle} of which you have done ${
        muscleGroups[activeMuscle] !== undefined
          ? 0
          : muscleGroups[activeMuscle]
      } sets with this week`}</Text>
    </Stack>
  );
}
