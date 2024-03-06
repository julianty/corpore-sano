import { CloseButton, NumberInput, Select, Table } from "@mantine/core";
import { Exercise, ExerciseMap } from "../types";
import exerciseCatalog from "../data/exerciseCatalog";

export function createExerciseFieldsFromObject(
  exercisesObject: ExerciseMap,
  changeHandler: (
    value: string | number,
    key: string,
    field: keyof Exercise
  ) => void,
  closeHandler: (workoutId: string) => void
) {
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
    function StyledNumberInput(fieldName: keyof Exercise) {
      return (
        <NumberInput
          key={`${uniqueId}${fieldName}`}
          defaultValue={exercise[fieldName]}
          onChange={(value) => changeHandler(value, key, fieldName)}
          styles={{ wrapper: { width: "30px" } }}
          hideControls
          variant="unstyled"
        />
      );
    }
    // Formats select items
    const exerciseCatalogArray = exerciseCatalog.data.map(
      (exerciseObj) => exerciseObj.name
    );
    // Generate a unique key for each exercise
    const uniqueId = `inputKey${key}`;
    return (
      <Table.Tr
        key={`${uniqueId}${exercise.name}${exercise.sets}${exercise.reps}${exercise.weight}`}
      >
        <Table.Td>
          <Select
            defaultValue={exercise.name}
            data={exerciseCatalogArray}
            onChange={(value) => changeHandler(value as string, key, "name")}
          />
        </Table.Td>
        {["sets", "reps", "weight"].map((fieldName) => (
          <Table.Td key={`${uniqueId}${fieldName}`}>
            {StyledNumberInput(fieldName as keyof Exercise)}
          </Table.Td>
        ))}
        <Table.Td>
          <CloseButton onClick={() => closeHandler(key)} />
        </Table.Td>
      </Table.Tr>
    );
  });
  return exerciseFields;
}
