import { Button, CloseButton, Group, Table } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useCallback, useEffect, useState } from "react";
import { Exercise, ExerciseMap, Workout } from "../types";
import { FirestoreActions } from "./FirestoreActions";
import { Timestamp } from "firebase/firestore";
import { ExerciseFields } from "./ExerciseFields";

export function WorkoutInstance(props: {
  workoutId: string;
  workoutCloseHandler: (key: string) => void;
}) {
  const { workoutId, workoutCloseHandler } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
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

  function changeHandler(
    value: string | number,
    key: string,
    field: keyof Exercise
  ) {
    // ChangeHandler callback function for uploading changes to the input fields
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], [field]: value },
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
      sets: 0,
      reps: 0,
      weight: 0,
    };
    const newExercise: ExerciseMap = {};
    newExercise[newExerciseName] = newExerciseObject;
    setExercisesObject({ ...exercisesObject, ...newExercise });
  }

  if (typeof exercisesObject !== "undefined") {
    if (editMode == false) {
      return (
        <>
          <Group>
            <DateInput
              onChange={(value) => {
                const timestampDate = Timestamp.fromDate(value as Date);
                setWorkoutDate(timestampDate);
                updateWorkoutData({ date: timestampDate, ...exercisesObject });
              }}
              value={workoutDate?.toDate()}
              maw={400}
            />
            {/* <CloseButton onClick={() => workoutCloseHandler(workoutId)} /> */}
            <Button onClick={() => setEditMode(true)}>edit</Button>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Sets</Table.Th>
                <Table.Th>Reps</Table.Th>
                <Table.Th>Weight</Table.Th>
                {/* <Table.Th>Delete</Table.Th> */}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <ExerciseFields
                exercisesObject={exercisesObject}
                changeHandler={changeHandler}
                closeHandler={closeHandler}
                editMode={editMode}
              />
              <Table.Tr>
                <Table.Td>
                  <Button onClick={addNewExercise}> Add New Exercise</Button>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </>
      );
    } else {
      return (
        <>
          <Group>
            <DateInput
              onChange={(value) => {
                const timestampDate = Timestamp.fromDate(value as Date);
                setWorkoutDate(timestampDate);
                updateWorkoutData({ date: timestampDate, ...exercisesObject });
              }}
              value={workoutDate?.toDate()}
              maw={400}
            />
            <CloseButton onClick={() => workoutCloseHandler(workoutId)} />
            <Button onClick={() => setEditMode(false)}>edit</Button>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Sets</Table.Th>
                <Table.Th>Reps</Table.Th>
                <Table.Th>Weight</Table.Th>
                <Table.Th>Delete</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <ExerciseFields
                exercisesObject={exercisesObject}
                changeHandler={changeHandler}
                closeHandler={closeHandler}
                editMode={editMode}
              />
              <Table.Tr>
                <Table.Td>
                  <Button onClick={addNewExercise}> Add New Exercise</Button>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </>
      );
    }
  }
}
