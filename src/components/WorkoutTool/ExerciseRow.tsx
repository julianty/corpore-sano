import {
  CloseButton,
  // Select,
  Table,
} from "@mantine/core";
import { Exercise } from "../../types";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import { StyledNumberInput } from "./StyledNumberInput";
import { ExerciseRowProps } from "../../types";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { ExerciseCombobox } from "./ExerciseComobox";

// TODO: Add exerciseHistory as a prop

const exerciseCatalog = exerciseCatalogUpdated;

export function ExerciseRow({
  exercise,
  exerciseKey,
  numberFieldChangeHandler: numberFieldChangeHandler,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
}: ExerciseRowProps) {
  // Redux state and dispatch
  const favoriteExercises = useAppSelector(
    (state) => state.exercises.favoriteExercises
  );
  const userId = useAppSelector((state) => state.auth.userId);
  const dispatch = useAppDispatch();

  // Update favorite exercises in Firestore when favoriteExercises changes
  useEffect(() => {
    FirestoreActions.updateFavoriteExercises(userId, favoriteExercises);
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
  const exerciseCatalogArray = exerciseCatalog.data.map(
    (exerciseObj) => exerciseObj.name
  );
  let deleteColumn;
  if (editMode == true) {
    deleteColumn = (
      <Table.Td>
        <CloseButton onClick={() => closeHandler(exerciseKey)} />
      </Table.Td>
    );
  } else {
    deleteColumn = null;
  }
  // Generate a unique key for each exercise
  const uniqueId = `inputKey${exerciseKey}`;
  return (
    <Table.Tr
      key={`${uniqueId}${exercise.name}${exercise.sets}${exercise.reps}${exercise.weight}`}
    >
      <Table.Td style={{ width: "250px" }}>
        <ExerciseCombobox
          defaultValue={exercise.variant}
          catalog={exerciseCatalogArray}
          exerciseNameChangeHandler={(name, variant) =>
            exerciseNameChangeHandler(name, variant, exerciseKey)
          }
          favoriteClickHandler={favoriteClickHandler}
          favoriteExercises={favoriteExercises}
        />
      </Table.Td>
      {["sets", "reps", "weight"].map((fieldName) => (
        <Table.Td key={`${uniqueId}${fieldName}`}>
          {StyledNumberInput(
            fieldName as keyof Exercise,
            exerciseKey,
            exercise,
            numberFieldChangeHandler
          )}
        </Table.Td>
      ))}
      {deleteColumn}
    </Table.Tr>
  );
}
