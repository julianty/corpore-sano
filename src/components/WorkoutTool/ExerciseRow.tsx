import {
  Button,
  CloseButton,
  Group,
  NumberInput,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import React, { useContext, useEffect, useMemo } from "react";
import { SetEntry } from "../../types";
import exerciseCatalogUpdated from "../../data/exerciseCatalogUpdated";
import { ExerciseRowProps } from "../../types";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { ExerciseCombobox } from "./ExerciseComobox";
import { UserProfileContext } from "../../App";
import { kgToLbs, lbsToKg } from "../../lib/utils";
import { IconPlus } from "@tabler/icons-react";

const exerciseCatalog = exerciseCatalogUpdated;

function ExerciseRowComponent({
  exercise,
  exerciseKey,
  onSetsChange,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
}: ExerciseRowProps) {
  const favoriteExercises = useAppSelector(
    (state) => state.exercises.favoriteExercises
  );
  const userId = useAppSelector((state) => state.auth.userId);
  const dispatch = useAppDispatch();
  const userProfileContext = useContext(UserProfileContext);
  if (!userProfileContext)
    throw new Error("Could not retrieve userProfileContext in ExerciseRow");
  const weightUnit = userProfileContext.userProfile.weightUnit as "kg" | "lbs";
  const weightField = `weight${weightUnit}` as keyof SetEntry;

  useEffect(() => {
    const timer = setTimeout(() => {
      FirestoreActions.updateFavoriteExercises(userId, favoriteExercises);
    }, 500);
    return () => clearTimeout(timer);
  }, [favoriteExercises, userId]);

  function favoriteClickHandler(exerciseName: string) {
    if (favoriteExercises.includes(exerciseName)) {
      dispatch({ type: "exercises/removeFavoriteExercise", payload: exerciseName });
    } else {
      dispatch({ type: "exercises/addFavoriteExercise", payload: exerciseName });
    }
  }

  const exerciseCatalogArray = useMemo(
    () => exerciseCatalog.data.map((exerciseObj) => exerciseObj.name),
    []
  );

  function updateSet(index: number, field: keyof SetEntry, value: number) {
    const updated = exercise.sets.map((s, i) => {
      if (i !== index) return s;
      if (field === "weightlbs") return { ...s, weightlbs: value, weightkg: lbsToKg(value) };
      if (field === "weightkg") return { ...s, weightkg: value, weightlbs: kgToLbs(value) };
      return { ...s, [field]: value };
    });
    onSetsChange(exerciseKey, updated);
  }

  function addSet() {
    const lastSet = exercise.sets.at(-1) ?? { reps: 0, weightlbs: 0, weightkg: 0 };
    onSetsChange(exerciseKey, [...exercise.sets, { ...lastSet }]);
  }

  function removeSet(index: number) {
    onSetsChange(exerciseKey, exercise.sets.filter((_, i) => i !== index));
  }

  return (
    <Paper p="xs" withBorder>
      <Stack gap="xs">
        <Group gap="xs">
          <div style={{ flex: 1 }}>
            <ExerciseCombobox
              defaultValue={exercise.variant}
              catalog={exerciseCatalogArray}
              exerciseNameChangeHandler={(name, variant) =>
                exerciseNameChangeHandler(name, variant, exerciseKey)
              }
              favoriteClickHandler={favoriteClickHandler}
              favoriteExercises={favoriteExercises}
            />
          </div>
          {editMode && (
            <CloseButton onClick={() => closeHandler(exerciseKey)} />
          )}
        </Group>

        {exercise.sets.length > 0 && (
          <Group gap="xs" px={4}>
            <Text size="xs" c="dimmed" w={20} ta="center">#</Text>
            <Text size="xs" c="dimmed" style={{ flex: 1 }} ta="center">Reps</Text>
            <Text size="xs" c="dimmed" style={{ flex: 1 }} ta="center">
              Weight ({weightUnit})
            </Text>
            {editMode && <div style={{ width: 28 }} />}
          </Group>
        )}

        {exercise.sets.map((set, index) => (
          <Group key={index} gap="xs" align="center" px={4}>
            <Text size="xs" c="dimmed" w={20} ta="center">{index + 1}</Text>
            <NumberInput
              value={set.reps}
              onChange={(v) => updateSet(index, "reps", Number(v))}
              onFocus={(e) => e.target.select()}
              hideControls
              style={{ flex: 1 }}
              styles={{ input: { textAlign: "center" } }}
            />
            <NumberInput
              value={set[weightField] as number}
              onChange={(v) => updateSet(index, weightField, Number(v))}
              onFocus={(e) => e.target.select()}
              hideControls
              style={{ flex: 1 }}
              styles={{ input: { textAlign: "center" } }}
            />
            {editMode && (
              <CloseButton size="sm" onClick={() => removeSet(index)} />
            )}
          </Group>
        ))}

        <Button
          leftSection={<IconPlus size={12} />}
          onClick={addSet}
          variant="subtle"
          size="xs"
        >
          Add Set
        </Button>
      </Stack>
    </Paper>
  );
}

export const ExerciseRow = React.memo(ExerciseRowComponent);
