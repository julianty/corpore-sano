import { CloseButton, Select, Table } from "@mantine/core";
import { Exercise } from "../types";
import exerciseCatalog from "../data/exerciseCatalog";
import { StyledNumberInput } from "./StyledNumberInput";
import { ExerciseRowProps } from "../types";

export function ExerciseRow({
  exercise,
  exerciseKey,
  changeHandler,
  closeHandler,
  editMode,
}: ExerciseRowProps) {
  // Formats select items
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
      <Table.Td>
        <Select
          defaultValue={exercise.name}
          data={exerciseCatalogArray}
          onChange={(value) =>
            changeHandler(value as string, exerciseKey, "name")
          }
        />
      </Table.Td>
      {["sets", "reps", "weight"].map((fieldName) => (
        <Table.Td key={`${uniqueId}${fieldName}`}>
          {StyledNumberInput(
            fieldName as keyof Exercise,
            exerciseKey,
            exercise,
            changeHandler
          )}
        </Table.Td>
      ))}
      {deleteColumn}
    </Table.Tr>
  );
}
