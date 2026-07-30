import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { useAppSelector } from "../../hooks";
import { useCallback, useRef, useState } from "react";
import { Exercise, ExerciseMap, SetEntry, Workout } from "../../types";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { Timestamp } from "firebase/firestore";
import { ExerciseFields } from "./ExerciseFields";
import { IconCalendar, IconEdit, IconPlus, IconX } from "@tabler/icons-react";
import { responsiveDimensions } from "../../styles/responsive";
import useExerciseHistoryWriter from "../../hooks/useExerciseHistoryWriter";
import { normalizeExerciseKey } from "../../core/services/exerciseHistory";
import {
  workoutToExerciseMap,
  exerciseMapToWorkout,
} from "../../core/services/workoutTransforms";

export function WorkoutInstance(props: {
  workoutId: string;
  initialData: Workout;
  workoutCloseHandler: (key: string) => void;
}) {
  const { workoutId, initialData, workoutCloseHandler } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>(() => {
    return initialData.date ?? Timestamp.now();
  });
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>(() =>
    workoutToExerciseMap(initialData),
  );
  const durationSecondsRef = useRef(initialData.durationSeconds);

  const userId = useAppSelector((state) => state.auth.userId);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 48em)") ?? false;
  const { scheduleWrite, flushKey } = useExerciseHistoryWriter();

  const updateWorkoutData = useCallback(
    (updatedDoc: Workout) =>
      FirestoreActions.updateWorkoutById(userId, workoutId, updatedDoc),
    [userId, workoutId],
  );

  function onSetsChange(key: string, sets: SetEntry[]) {
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], sets },
    };
    setExercisesObject(nextState);
    updateWorkoutData(
      exerciseMapToWorkout(nextState, workoutDate, durationSecondsRef.current),
    );
    const timestampString = workoutDate.toDate().toISOString().slice(0, 10);
    scheduleWrite(key, nextState, timestampString);
  }

  async function exerciseNameChangeHandler(
    name: string,
    variant: string,
    key: string,
    customExerciseId?: string,
  ) {
    const newKey = normalizeExerciseKey(variant);
    const oldKey = normalizeExerciseKey(exercisesObject[key]?.variant ?? "");
    if (oldKey && oldKey !== newKey) {
      // Commit any in-memory sets to Firestore under the old key before we touch history.
      await flushKey(key, exercisesObject);
      // Remove only this workout's sets from the old key — prior workouts' lifts must stay.
      // (Don't use migrateExerciseHistory here: that would move the entire lifetime history,
      // which is wrong when the user is swapping exercises rather than correcting a typo.)
      const sets = (exercisesObject[key]?.sets ?? [])
        .filter((s) => s.weightkg > 0 && s.reps > 0)
        .map((s) => ({ weight: s.weightkg, reps: s.reps }));
      await FirestoreActions.removeExerciseSetsFromHistory(userId, oldKey, sets);
    }
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], name: name, variant: variant },
    };
    if (customExerciseId !== undefined) {
      nextState[key].customExerciseId = customExerciseId;
    } else {
      delete nextState[key].customExerciseId;
    }
    setExercisesObject(nextState);
    updateWorkoutData(
      exerciseMapToWorkout(nextState, workoutDate, durationSecondsRef.current),
    );
    if (oldKey && oldKey !== newKey && newKey) {
      // Queue a write of this workout's sets under the new key so they land in history.
      const timestampString = workoutDate.toDate().toISOString().slice(0, 10);
      scheduleWrite(key, nextState, timestampString);
    }
  }

  function closeHandler(exerciseKey: string) {
    // Remove the clicked exercise from the exercise object
    const nextState = { ...exercisesObject };
    delete nextState[exerciseKey];
    setExercisesObject(nextState);
    updateWorkoutData(
      exerciseMapToWorkout(nextState, workoutDate, durationSecondsRef.current),
    );
  }

  function addNewExercise() {
    // ClickHandler for adding a new exercise
    const newOrder = Object.values(exercisesObject).length + 1;
    const newExerciseName = `exercise${Date.now()}`;
    const newExerciseObject: Exercise = {
      order: newOrder,
      name: "",
      variant: "",
      sets: [],
    };
    const newExercise: ExerciseMap = {};
    newExercise[newExerciseName] = newExerciseObject;
    setExercisesObject({ ...exercisesObject, ...newExercise });
  }

  return (
    <Paper
      id={`workout-${workoutId}`}
      p={{ base: "xs", sm: "md" }}
      withBorder
      shadow="sm"
    >
      <Stack gap="sm">
        <Group>
          <DateInput
            onChange={(value) => {
              const timestampDate = Timestamp.fromDate(value as Date);
              setWorkoutDate(timestampDate);
              updateWorkoutData(
                exerciseMapToWorkout(
                  exercisesObject,
                  timestampDate,
                  durationSecondsRef.current,
                ),
              );
            }}
            value={workoutDate?.toDate()}
            maw={responsiveDimensions.inputMaxWidth.md}
            rightSection={<IconCalendar size={16} />}
            aria-label="Workout date"
          />
          <Group ml="auto" gap="xs">
            <Tooltip
              label={editMode ? "Exit edit mode" : "Edit workout"}
              withArrow
            >
              <ActionIcon
                variant={editMode ? "filled" : "light"}
                onClick={() => setEditMode(!editMode)}
                color="orange"
                size="lg"
                aria-label={editMode ? "Exit edit mode" : "Edit workout"}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            {editMode && (
              <Tooltip label="Delete workout" withArrow>
                <ActionIcon
                  color="red"
                  onClick={() => setDeleteConfirmOpen(true)}
                  variant="light"
                  size="lg"
                  aria-label="Delete this workout"
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Divider />
        <Stack gap="xs">
          <ExerciseFields
            exercisesObject={exercisesObject}
            onSetsChange={onSetsChange}
            exerciseNameChangeHandler={exerciseNameChangeHandler}
            closeHandler={closeHandler}
            editMode={editMode}
            isMobile={isMobile}
          />
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={addNewExercise}
            variant="light"
            fullWidth
            aria-label="Add a new exercise to this workout"
          >
            Add Exercise
          </Button>
        </Stack>
      </Stack>
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete workout"
        centered
      >
        <Text mb="lg">
          Are you sure you want to delete this workout? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              setDeleteConfirmOpen(false);
              workoutCloseHandler(workoutId);
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
}
