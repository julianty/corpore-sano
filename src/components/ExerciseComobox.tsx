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
  onChange: (value: string) => void;
  favoriteClickHandler: (exerciseName: string) => void;
  favoriteExercises: string[];
}

export function ExerciseCombobox(props: ExerciseComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState<string | null>(props.defaultValue);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseNames = exerciseCatalogUpdated.data.map(
    (exercise) => exercise.name
  );

  return (
    <Combobox
      store={combobox}
      resetSelectionOnOptionHover
      onOptionSubmit={(val) => {
        setValue(val);
        combobox.updateSelectedOptionIndex("active");
        props.onChange(val);
      }}
    >
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
          {selectedExercise === null
            ? exerciseNames.map((exerciseName) => {
                return (
                  <Combobox.Option
                    value={exerciseName}
                    key={exerciseName}
                    onMouseDown={() => setSelectedExercise(exerciseName)}
                  >
                    {exerciseName}
                  </Combobox.Option>
                );
              })
            : exerciseCatalogUpdated.data
                .filter((exercise) => exercise.name === selectedExercise)[0]
                ?.variants?.map((variation) => (
                  <Combobox.Option
                    value={variation}
                    key={variation}
                    onClick={() => {
                      setValue(variation);
                      setSelectedExercise(null);
                      combobox.closeDropdown();
                    }}
                  >
                    {variation}
                  </Combobox.Option>
                ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
