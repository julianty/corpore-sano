import { Group, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";

export function WorkoutInstance() {
  const form = useForm({
    initialValues: {
      workoutDate: new Date(),
      exercises: [{ name: "Lateral Raise", sets: 2, reps: 10, weight: 30 }],
    },
  });
  const exerciseFields = form.values.exercises.map((_, index) => {
    const uniqueId = `inputKey${index}`;
    return (
      <Group key={`Group${uniqueId}`}>
        <TextInput
          key={`${uniqueId}name`}
          {...form.getInputProps(`exercises.${index}.name`)}
        />
        <NumberInput
          key={`${uniqueId}sets`}
          {...form.getInputProps(`exercises.${index}.sets`)}
        />
        <NumberInput
          key={`${uniqueId}reps`}
          {...form.getInputProps(`exercises.${index}.reps`)}
        />
        <NumberInput
          key={`${uniqueId}weight`}
          {...form.getInputProps(`exercises.${index}.weight`)}
        />
      </Group>
    );
  });
  return (
    <form>
      <DateInput {...form.getInputProps("workoutDate")} />
      {exerciseFields}
    </form>
  );
}
