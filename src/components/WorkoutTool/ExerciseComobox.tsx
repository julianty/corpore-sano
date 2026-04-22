import { Combobox, ComboboxProps, InputBase, useCombobox } from "@mantine/core";
import React, { useState } from "react";
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
  const [search, setSearch] = useState("");

  const { exerciseNameChangeHandler } = props;
  const searchText = search.toLowerCase().trim();

  const filteredOptions = EXERCISE_OPTIONS_DATA.map(
    ({ exerciseName, variants }) => {
      // If group name matches, show all variants
      if (exerciseName.toLowerCase().includes(searchText)) {
        return { exerciseName, variants };
      }
      // Otherwise, only show matching variants
      const filteredVariants = variants.filter((variant) =>
        variant.toLowerCase().includes(searchText),
      );
      return { exerciseName, variants: filteredVariants };
    },
  )
    // Only include groups with at least one variant to show
    .filter(({ variants }) => variants.length > 0);

  const options = filteredOptions.map(({ exerciseName, variants }) => (
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

  return (
    <Combobox
      store={combobox}
      resetSelectionOnOptionHover
      onOptionSubmit={(val) => {
        setValue(val);
        setSearch(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.openDropdown()}
          rightSectionPointerEvents="none"
          style={{ overflow: "hidden" }}
          value={value ? value : search}
          placeholder="Select an exercise"
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || "");
          }}
          onChange={(event) => {
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
        ></InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options
          mah={responsiveDimensions.dropdownMaxHeight.md}
          style={{ overflowY: "auto", maxHeight: "min(400px, 60vh)" }}
        >
          {options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>Nothing found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export const ExerciseCombobox = React.memo(ExerciseComboboxComponent);
