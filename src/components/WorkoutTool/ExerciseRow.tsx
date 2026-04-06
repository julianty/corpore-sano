import {
  CloseButton,
  Group,
  Paper,
  Stack,
  Table,
} from "@mantine/core";
import React, { useContext, useEffect, useMemo } from "react";
import { Exercise } from "../../types";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import { StyledNumberInput } from "./StyledNumberInput";
import { ExerciseRowProps } from "../../types";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { ExerciseCombobox } from "./ExerciseComobox";
import { UserProfileContext } from "../../App";
import { responsiveDimensions } from "../../styles/responsive";

// TODO: Add exerciseHistory as a prop

const exerciseCatalog = exerciseCatalogUpdated;

function ExerciseRowComponent({
  exercise,
  exerciseKey,
  numberFieldChangeHandler,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
  isMobile,
}: ExerciseRowProps) {
  // Redux state and dispatch
  const favoriteExercises = useAppSelector(
    (state) => state.exercises.favoriteExercises
  );
  const userId = useAppSelector((state) => state.auth.userId);
  const dispatch = useAppDispatch();
  const userProfileContext = useContext(UserProfileContext);
  if (!userProfileContext)
    throw new Error("Could not retrieve userProfileContext in ExerciseRow");
  const weightUnit = userProfileContext.userProfile.weightUnit as "kg" | "lbs";

  // Debounce Firestore writes when favoriteExercises changes
  useEffect(() => {
    const timer = setTimeout(() => {
      FirestoreActions.updateFavoriteExercises(userId, favoriteExercises);
    }, 500);
    return () => clearTimeout(timer);
  }, [favoriteExercises, userId]);

  // Event Handlers
  function favoriteClickHandler(exerciseName: string) {
    console.log(
      `favoriteExercises: ${favoriteExercises}, exerciseName: ${exerciseName}`
    );
    if (favoriteExercises.includes(exerciseName)) {
      dispatch({
        type: "exercises/removeFavoriteExercise",
        payload: exerciseName,
      });
    } else {
      dispatch({
        type: "exercises/addFavoriteExercise",
        payload: exerciseName,
      });
    }
  }
  // Formats items for select node
  const exerciseCatalogArray = useMemo(
    () => exerciseCatalog.data.map((exerciseObj) => exerciseObj.name),
    [] // Static data, no dependencies
  );

  const combobox = (
    <ExerciseCombobox
      defaultValue={exercise.variant}
      catalog={exerciseCatalogArray}
      exerciseNameChangeHandler={(name, variant) =>
        exerciseNameChangeHandler(name, variant, exerciseKey)
      }
      favoriteClickHandler={favoriteClickHandler}
      favoriteExercises={favoriteExercises}
    />
  );

  const numberFields = ["sets", "reps", `weight${weightUnit}`] as const;
  const fieldLabels: Record<string, string> = {
    sets: "Sets",
    reps: "Reps",
    weightlbs: "Weight (lbs)",
    weightkg: "Weight (kg)",
  };

  if (isMobile) {
    return (
      <Paper p="xs" withBorder>
        <Stack gap="xs">
          <Group gap="xs">
            <div style={{ flex: 1 }}>{combobox}</div>
            {editMode && (
              <CloseButton onClick={() => closeHandler(exerciseKey)} />
            )}
          </Group>
          <Group grow gap="xs">
            {numberFields.map((fieldName) => (
              <StyledNumberInput
                key={`${exerciseKey}${fieldName}`}
                fieldName={fieldName as keyof Exercise}
                exerciseKey={exerciseKey}
                exercise={exercise}
                numberFieldChangeHandler={numberFieldChangeHandler}
                isMobile
                label={fieldLabels[fieldName]}
              />
            ))}
          </Group>
        </Stack>
      </Paper>
    );
  }

  // Desktop: table row layout
  const uniqueId = `inputKey${exerciseKey}`;
  return (
    <Table.Tr
      key={`${uniqueId}${exercise.name}${exercise.sets}${exercise.reps}${exercise.weightkg}`}
    >
      <Table.Td style={{ width: responsiveDimensions.exerciseRowWidth.md }}>
        {combobox}
      </Table.Td>
      {numberFields.map((fieldName) => (
        <Table.Td key={`${uniqueId}${fieldName}`} ta="center">
          <StyledNumberInput
            fieldName={fieldName as keyof Exercise}
            exerciseKey={exerciseKey}
            exercise={exercise}
            numberFieldChangeHandler={numberFieldChangeHandler}
          />
        </Table.Td>
      ))}
      {editMode && (
        <Table.Td>
          <CloseButton onClick={() => closeHandler(exerciseKey)} />
        </Table.Td>
      )}
    </Table.Tr>
  );
}

export const ExerciseRow = React.memo(ExerciseRowComponent);
