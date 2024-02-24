import { Group, NumberInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useCallback, useEffect, useState } from "react";
import { Exercise, ExerciseMap, Workout } from "../types";
import { FirestoreActions } from "./FirestoreActions";
import { Timestamp } from "firebase/firestore";
import exerciseCatalog from "../data/exerciseCatalog";

export function WorkoutInstance(props: { workoutId: string }) {
  const { workoutId } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>({});

  const userId = useAppSelector((state) => state.auth.userId);

  const updateWorkoutData = useCallback(
    (updatedDoc: Workout) =>
      FirestoreActions.updateWorkoutById(userId, workoutId, updatedDoc),
    [userId, workoutId]
  );

  useEffect(() => {
    // Fetch user data
    setWorkoutDate(Timestamp.now());
    setExercisesObject({});
    FirestoreActions.fetchData(userId, workoutId).then((value) => {
      const resultObject = value as Workout;
      const { date, ...exercises } = resultObject;
      setWorkoutDate(date);
      setExercisesObject(exercises as ExerciseMap);
    });
  }, [userId, workoutId]);

  const exercisesArray = Object.entries(exercisesObject).sort(
    (keyExA, keyExB) => {
      const orderA = keyExA[1].order;
      const orderB = keyExB[1].order;
      return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
    }
  );
  function changeHandler(
    value: string | number,
    key: string,
    field: keyof Exercise
  ) {
    // callback function for uploading changes to the input fields
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], [field]: value },
    };
    setExercisesObject(nextState);
    updateWorkoutData({ date: workoutDate, ...nextState });
  }
  const exerciseFields = exercisesArray.map(([key, exercise]) => {
    const exerciseCatalogArray = exerciseCatalog.data.map(
      (exerciseObj) => exerciseObj.name
    );
    const uniqueId = `inputKey${key}`;

    return (
      <Group key={`Group${uniqueId}`}>
        <Select
          defaultValue={exercise.name}
          data={exerciseCatalogArray}
          onChange={(value) => changeHandler(value as string, key, "name")}
        />
        <NumberInput
          key={`${uniqueId}sets`}
          defaultValue={exercise.sets}
          onChange={(value) => changeHandler(value, key, "sets")}
        />
        <NumberInput
          key={`${uniqueId}reps`}
          defaultValue={exercise.reps}
          onChange={(value) => changeHandler(value, key, "reps")}
        />
        <NumberInput
          key={`${uniqueId}weight`}
          defaultValue={exercise.weight}
          onChange={(value) => changeHandler(value, key, "weight")}
        />
      </Group>
    );
  });

  if (typeof exercisesObject !== "undefined") {
    return (
      <>
        <DateInput
          onChange={(value) => {
            const timestampDate = Timestamp.fromDate(value as Date);
            setWorkoutDate(timestampDate);
            updateWorkoutData({ date: timestampDate, ...exercisesObject });
          }}
          value={workoutDate?.toDate()}
          maw={400}
        />
        {exerciseFields}
      </>
    );
  }
}
