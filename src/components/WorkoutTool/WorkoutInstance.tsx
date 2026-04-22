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
import { useCallback, useState } from "react";
import { Exercise, ExerciseMap, SetEntry, Workout } from "../../types";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { Timestamp } from "firebase/firestore";
import { ExerciseFields } from "./ExerciseFields";
import { IconCalendar, IconEdit, IconPlus, IconX } from "@tabler/icons-react";
import { responsiveDimensions } from "../../styles/responsive";
// TODO: Have a hover that pops up that explains how to change from kg to lbs.
// TODO: Make it so that the default value in the fields are the "lastKg" from user Profile.
export function WorkoutInstance(props: {
  workoutId: string;
  initialData: Workout;
  workoutCloseHandler: (key: string) => void;
}) {
  const { workoutId, initialData, workoutCloseHandler } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>(() => {
    return initialData.date ?? Timestamp.now();
  });
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>(() => {
    const { date, ...exercises } = initialData as unknown as Record<
      string,
      unknown
    >;
    return exercises as ExerciseMap;
  });

  const userId = useAppSelector((state) => state.auth.userId);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

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
    updateWorkoutData({ date: workoutDate, ...nextState });
  }

  function exerciseNameChangeHandler(
    name: string,
    variant: string,
    key: string,
  ) {
    // ChangeHandler for the exercise name
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], name: name, variant: variant },
    };
    setExercisesObject(nextState);
    updateWorkoutData({ date: workoutDate, ...nextState });
  }

  function closeHandler(exerciseKey: string) {
    // Remove the clicked exercise from the exercise object
    const nextState = { ...exercisesObject };
    delete nextState[exerciseKey];
    setExercisesObject(nextState);
    updateWorkoutData({ date: workoutDate, ...nextState });
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
              updateWorkoutData({ date: timestampDate, ...exercisesObject });
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
          <Button
            variant="default"
            onClick={() => setDeleteConfirmOpen(false)}
          >
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
