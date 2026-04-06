import {
  Combobox,
  ComboboxProps,
  Input,
  InputBase,
  useCombobox,
} from "@mantine/core";
import React, { useState, useMemo } from "react";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import { responsiveDimensions } from "../../styles/responsive";
interface ExerciseComboboxProps extends ComboboxProps {
  catalog: string[];
  defaultValue: string;
  favoriteClickHandler: (exerciseName: string) => void;
  exerciseNameChangeHandler: (name: string, variant: string) => void;
  favoriteExercises: string[];
}

// Static catalog data — computed once at module level, never changes
const EXERCISE_NAMES = exerciseCatalogUpdated.data.map((e) => e.name);
const EXERCISE_OPTIONS_DATA = EXERCISE_NAMES.map((exerciseName) => ({
  exerciseName,
  variants:
    exerciseCatalogUpdated.data.find((e) => e.name === exerciseName)
      ?.variants ?? [],
}));

function ExerciseComboboxComponent(props: ExerciseComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState<string | null>(props.defaultValue);

  const { exerciseNameChangeHandler } = props;
  const options = useMemo(() => {
    return EXERCISE_OPTIONS_DATA.map(({ exerciseName, variants }) => (
      <Combobox.Group label={exerciseName} key={exerciseName}>
        {variants.map((variant) => (
          <Combobox.Option
            key={variant}
            value={variant}
            onClick={() => {
              setValue(variant);
              exerciseNameChangeHandler(exerciseName, variant);
            }}
          >
            {variant}
          </Combobox.Option>
        ))}
      </Combobox.Group>
    ));
  }, [exerciseNameChangeHandler]);

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
        <Combobox.Options
          mah={responsiveDimensions.dropdownMaxHeight.md}
          style={{ overflowY: "auto", maxHeight: "min(400px, 60vh)" }}
        >
          {options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export const ExerciseCombobox = React.memo(ExerciseComboboxComponent);
