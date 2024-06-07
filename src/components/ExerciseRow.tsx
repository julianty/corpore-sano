import {
  CloseButton,
  Combobox,
  ComboboxProps,
  Group,
  Input,
  InputBase,
  // Select,
  Table,
  useCombobox,
} from "@mantine/core";
import { Exercise } from "../types";
import exerciseCatalog from "../data/exerciseCatalog";
import { StyledNumberInput } from "./StyledNumberInput";
import { ExerciseRowProps } from "../types";
import { useState } from "react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { useAppSelector } from "../hooks";

// TODO: Add exerciseHistory as a prop

export function ExerciseRow({
  exercise,
  exerciseKey,
  changeHandler,
  closeHandler,
  editMode,
}: ExerciseRowProps) {
  // Formats items for select node
  const exerciseCatalogArray = exerciseCatalog.data.map(
    (exerciseObj) => exerciseObj.name
  );
  const favoriteExercises = useAppSelector(
    (state) => state.exercises.favoriteExercises
  );
  let deleteColumn;
  if (editMode == true) {
    deleteColumn = (
      <Table.Td>
        <CloseButton onClick={() => closeHandler(exerciseKey)} />
      </Table.Td>
    );
  } else {
    deleteColumn = null;
  }
  // Generate a unique key for each exercise
  const uniqueId = `inputKey${exerciseKey}`;
  return (
    <Table.Tr
      key={`${uniqueId}${exercise.name}${exercise.sets}${exercise.reps}${exercise.weight}`}
    >
      <Table.Td style={{ width: "300px" }}>
        {/* <Select
          searchable
          defaultValue={exercise.name}
          data={exerciseCatalogArray}
          onChange={(value) =>
            changeHandler(value as string, exerciseKey, "name")
          }
        /> */}
        <ExerciseCombobox
          defaultValue={exercise.name}
          catalog={exerciseCatalogArray}
          onChange={(value) =>
            changeHandler(value as string, exerciseKey, "name")
          }
          // TODO: Implement favoriteClickHandler
          favoriteClickHandler={() => {
            console.log("Favorite clicked");
          }}
          favoriteExercises={favoriteExercises}
        />
      </Table.Td>
      {["sets", "reps", "weight"].map((fieldName) => (
        <Table.Td key={`${uniqueId}${fieldName}`}>
          {StyledNumberInput(
            fieldName as keyof Exercise,
            exerciseKey,
            exercise,
            changeHandler
          )}
        </Table.Td>
      ))}
      {deleteColumn}
    </Table.Tr>
  );
}

interface ExerciseComboboxProps extends ComboboxProps {
  catalog: string[];
  defaultValue: string;
  onChange: (value: string) => void;
  favoriteClickHandler: () => void;
  favoriteExercises: string[];
}

function ExerciseCombobox(props: ExerciseComboboxProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState<string | null>(props.defaultValue);
  const catalog = props.catalog;

  const options = catalog.map((exerciseName) => {
    return (
      <Combobox.Option
        active={exerciseName === props.defaultValue}
        value={exerciseName}
        key={exerciseName}
      >
        <Group justify="space-between">
          {exerciseName}
          {props.favoriteExercises.includes(exerciseName) ? (
            <IconStarFilled style={{ height: "1rem" }} />
          ) : (
            <IconStar
              onClick={props.favoriteClickHandler}
              style={{ height: "1rem" }}
            />
          )}
        </Group>
      </Combobox.Option>
    );
  });
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
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
          style={{ overflow: "hidden" }}
        >
          {value || <Input.Placeholder>Pick value</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
