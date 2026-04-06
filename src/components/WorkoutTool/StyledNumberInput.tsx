import { NumberInput, Text, Stack } from "@mantine/core";
import { Exercise } from "../../types";

// TODO: defaultValue needs to be updated -- make it read from exerciseHistory

interface StyledNumberInputProps {
  fieldName: keyof Exercise;
  exerciseKey: string;
  exercise: Exercise;
  numberFieldChangeHandler: (
    value: number,
    key: string,
    fieldname: keyof Exercise,
  ) => void;
  isMobile?: boolean;
  label?: string;
}

export function StyledNumberInput({
  fieldName,
  exerciseKey,
  exercise,
  numberFieldChangeHandler,
  isMobile,
  label,
}: StyledNumberInputProps) {
  const input = (
    <NumberInput
      defaultValue={exercise[fieldName]}
      onBlur={(event) =>
        numberFieldChangeHandler(
          Number(event.target.value),
          exerciseKey,
          fieldName,
        )
      }
      onFocus={(event) => event.target.select()}
      styles={{
        wrapper: { width: isMobile ? "100%" : "fit-content" },
        input: {
          outline: "1px solid var(--mantine-color-default-border)",
          padding: "5px",
          width: isMobile ? "100%" : "72px",
          textAlign: "center",
        },
      }}
      hideControls
      variant="unstyled"
    />
  );

  if (isMobile && label) {
    return (
      <Stack gap={2} style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" ta="center">
          {label}
        </Text>
        {input}
      </Stack>
    );
  }

  return input;
}
