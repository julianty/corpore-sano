import { Button, Group, Paper, Table } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../../hooks";
import { useCallback, useEffect, useState } from "react";
import { Exercise, ExerciseMap, Workout } from "../../types";
import { FirestoreActions } from "../../helperFunctions/FirestoreActions";
import { Timestamp } from "firebase/firestore";
import { ExerciseFields } from "./ExerciseFields";
import { IconCalendar, IconEdit, IconPlus, IconX } from "@tabler/icons-react";
// TODO: Have a hover that pops up that explains how to change from kg to lbs.
// TODO: Make it so that the default value in the fields are the "lastKg" from user Profile.
export function WorkoutInstance(props: {
  workoutId: string;
  workoutCloseHandler: (key: string) => void;
}) {
  const { workoutId, workoutCloseHandler } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
  // Tracks the exercises in this workout as separate objects
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>({});

  const userId = useAppSelector((state) => state.auth.userId);
  const [editMode, setEditMode] = useState(false);

  const updateWorkoutData = useCallback(
    (updatedDoc: Workout) =>
      FirestoreActions.updateWorkoutById(userId, workoutId, updatedDoc),
    [userId, workoutId]
  );

  useEffect(() => {
    // Runs when a new user logs in
    // Clear data
    setWorkoutDate(Timestamp.now());
    setExercisesObject({});

    // Fetch user data
    FirestoreActions.fetchData(userId, workoutId).then((value) => {
      // If workout was just created, value = undefined
      if (value === undefined) return;
      const resultObject = value as Workout;
      const { date, ...exercises } = resultObject;
      setWorkoutDate(date);
      setExercisesObject(exercises as ExerciseMap);
    });
  }, [userId, workoutId]);

  function numberFieldChangeHandler(
    value: number,
    key: string,
    field: keyof Exercise
  ) {
    // TODO: Update exercise history i.e. new Max, last weight lifted
    // ChangeHandler callback function for uploading changes to the input fields
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], [field]: value },
    };
    setExercisesObject(nextState);
    // Call for an update to firebase
    updateWorkoutData({ date: workoutDate, ...nextState });
  }

  function exerciseNameChangeHandler(
    name: string,
    variant: string,
    key: string
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
      sets: 0,
      reps: 0,
      weight: 0,
    };
    const newExercise: ExerciseMap = {};
    newExercise[newExerciseName] = newExerciseObject;
    setExercisesObject({ ...exercisesObject, ...newExercise });
  }

  return (
    <Paper p={{ xs: "md", md: "lg" }} withBorder>
      <Group>
        <DateInput
          onChange={(value) => {
            const timestampDate = Timestamp.fromDate(value as Date);
            setWorkoutDate(timestampDate);
            updateWorkoutData({ date: timestampDate, ...exercisesObject });
          }}
          value={workoutDate?.toDate()}
          maw={400}
          rightSection={<IconCalendar size={16} />}
        />
        <Button
          ml="auto"
          variant="light"
          onClick={() => setEditMode(!editMode)}
          color={"orange"}
          leftSection={<IconEdit size={16} />}
        >
          edit
        </Button>
        <Button
          color="red"
          display={editMode ? "block" : "none"}
          onClick={() => workoutCloseHandler(workoutId)}
          leftSection={<IconX size={16} />}
          variant="light"
        >
          Delete Workout
        </Button>
      </Group>
      <Table>
        <Table.Thead>
          <Table.Tr>
            {["Exercise Name", "Sets", "Reps", "Weight", "Delete"]
              .filter((colName) => {
                if (colName !== "Delete") return true;
                if (editMode === true) return true;
              })
              .map((colName) => (
                <Table.Th key={colName}>{colName}</Table.Th>
              ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <ExerciseFields
            exercisesObject={exercisesObject}
            numberFieldChangeHandler={numberFieldChangeHandler}
            exerciseNameChangeHandler={exerciseNameChangeHandler}
            closeHandler={closeHandler}
            editMode={editMode}
          />
          <Table.Tr>
            <Table.Td>
              <Button
                leftSection={<IconPlus size={14} />}
                onClick={addNewExercise}
                variant="light"
              >
                Add Exercise
              </Button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
