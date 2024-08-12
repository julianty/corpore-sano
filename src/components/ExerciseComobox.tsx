import {
  Combobox,
  ComboboxProps,
  Input,
  InputBase,
  useCombobox,
} from "@mantine/core";
import { useState } from "react";
import exerciseCatalogUpdated from "../data/exerciseCatalogUpdated";
interface ExerciseComboboxProps extends ComboboxProps {
  catalog: string[];
  defaultValue: string;
  favoriteClickHandler: (exerciseName: string) => void;
  exerciseNameChangeHandler: (name: string, variant: string) => void;
  favoriteExercises: string[];
}

export function ExerciseCombobox(props: ExerciseComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState<string | null>(props.defaultValue);
  // const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseNames = exerciseCatalogUpdated.data.map(
    (exercise) => exercise.name
  );

  const options = exerciseNames.map((exerciseName) => {
    return (
      <Combobox.Group label={exerciseName} key={exerciseName}>
        {exerciseCatalogUpdated.data
          .filter((exercise) => exercise.name === exerciseName)[0]
          .variants?.map((variant) => {
            return (
              <Combobox.Option
                key={variant}
                value={variant}
                onClick={() => {
                  // props.onChange(variant, "variant");
                  setValue(variant);
                  // props.onChange(exerciseName, "name");
                  props.exerciseNameChangeHandler(exerciseName, variant);
                }}
              >
                {variant}
              </Combobox.Option>
            );
          })}
      </Combobox.Group>
    );
  });

  return (
    <Combobox store={combobox} resetSelectionOnOptionHover>
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.openDropdown()}
          rightSectionPointerEvents="none"
          style={{ overflow: "hidden" }}
        >
          {value || <Input.Placeholder>{}</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options mah={400} style={{ overflowY: "auto" }}>
          {options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
