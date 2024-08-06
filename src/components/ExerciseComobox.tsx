import {
  Combobox,
  ComboboxProps,
  Input,
  InputBase,
  useCombobox,
} from "@mantine/core";
import { useState } from "react";
import exerciseCatalogUpdated from "../data/exerciseCatalogUpdated";
import { Exercise } from "../types";
interface ExerciseComboboxProps extends ComboboxProps {
  catalog: string[];
  defaultValue: string;
  onChange: (value: string, property: keyof Exercise) => void;
  favoriteClickHandler: (exerciseName: string) => void;
  favoriteExercises: string[];
}

export function ExerciseCombobox(props: ExerciseComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState<string | null>(props.defaultValue);
  // const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseNames = exerciseCatalogUpdated.data.map(
    (exercise) => exercise.name
  );

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
          {value || <Input.Placeholder>Pick value</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {exerciseNames.map((exerciseName) => {
            return (
              <Combobox.Option
                value={exerciseName}
                key={exerciseName}
                onClick={() => {
                  setValue(exerciseName);
                  props.onChange(exerciseName, "name");
                  combobox.closeDropdown();
                }}
              >
                {exerciseName}
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
