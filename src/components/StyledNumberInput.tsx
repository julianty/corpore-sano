import { NumberInput } from "@mantine/core";
import { Exercise } from "../types";

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
      onChange={(value) => changeHandler(value, key, fieldName)}
      styles={{ wrapper: { width: "30px" } }}
      hideControls
      variant="unstyled"
    />
  );
}
