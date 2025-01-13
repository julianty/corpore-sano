import { NumberInput } from "@mantine/core";
import { Exercise } from "../../types";

// TODO: defaultValue needs to be updated -- make it read from exerciseHistory

export function StyledNumberInput(
  fieldName: keyof Exercise,
  key: string,
  exercise: Exercise,
  numberFieldChangeHandler: (
    value: number,
    key: string,
    fieldname: keyof Exercise
  ) => void
) {
  return (
    <NumberInput
      key={`${key}${fieldName}`}
      defaultValue={exercise[fieldName]}
      onBlur={(event) =>
        numberFieldChangeHandler(Number(event.target.value), key, fieldName)
      }
      onFocus={(event) => event.target.select()}
      styles={{
        wrapper: { width: "fit-content" },
        input: { outline: "1px solid #495057", padding: "5px" },
      }}
      hideControls
      variant={"unstyled"}
    />
  );
}
