import { ExerciseRowProps } from "../../types";
import { ExerciseFieldsProps } from "../../types";
import { ExerciseRow } from "./ExerciseRow";

export function ExerciseFields({
  exercisesObject,
  numberFieldChangeHandler,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
}: ExerciseFieldsProps) {
  // Sorts the array based on the 'order' property of the exercise object
  const exercisesArray = Object.entries(exercisesObject).sort(
    (keyExA, keyExB) => {
      const orderA = keyExA[1].order;
      const orderB = keyExB[1].order;
      return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
    }
  );
  // Generates an array of <NumberInputs> corresponding to
  // exercisename - sets - reps - weight
  const exerciseFields = exercisesArray.map(([key, exercise]) => {
    const exerciseRowProps: ExerciseRowProps = {
      exercise,
      exerciseKey: key,
      numberFieldChangeHandler,
      closeHandler,
      exerciseNameChangeHandler,
      editMode,
    };
    return <ExerciseRow key={key} {...exerciseRowProps} />;
  });
  return exerciseFields;
}
