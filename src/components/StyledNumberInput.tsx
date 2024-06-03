import { NumberInput } from "@mantine/core";
import { Exercise } from "../types";

// defaultValue needs to be updated -- make it read from exerciseHistory

export function StyledNumberInput(
  fieldName: keyof Exercise,
  key: string,
  exercise: Exercise,
  changeHandler: (
    value: string | number,
    key: string,
    fieldname: keyof Exercise
  ) => void
) {
  return (
    <NumberInput
      key={`${key}${fieldName}`}
      defaultValue={exercise[fieldName]}
      onBlur={(event) => changeHandler(event.target.value, key, fieldName)}
      styles={{ wrapper: { width: "fit-content" } }}
      hideControls
      // variant={"unstyled"}
    />
  );
}
