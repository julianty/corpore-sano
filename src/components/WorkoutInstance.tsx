import { Group, NumberInput, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useEffect, useState } from "react";
import { Exercise, ExerciseMap, Workout } from "../types";
import { FirestoreActions } from "./FirestoreActions";
import { Timestamp } from "firebase/firestore";
import exerciseCatalog from "../data/exerciseCatalog";

export function WorkoutInstance(props: { workoutId: string }) {
  const { workoutId } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>({});

  const userId = useAppSelector((state) => state.auth.userId);

  useEffect(() => {
    // Fetch user data
    FirestoreActions.fetchData(userId).then((value) => {
      const resultObject = value as Workout;
      const { date, ...exercises } = resultObject;
      setWorkoutDate(date);
      setExercisesObject(exercises as ExerciseMap);
    });
  }, [userId]);

  useEffect(() => {
    // Runs when a change is detected on input values
    if (Object.keys(exercisesObject).length !== 0) {
      const updatedDoc: Workout = {
        date: workoutDate,
        ...exercisesObject,
      };
      FirestoreActions.updateWorkoutById(userId, workoutId, updatedDoc);
    }
  }, [exercisesObject, workoutDate]);

  function changeHandler(
    value: string | number,
    key: string,
    field: keyof Exercise
  ) {
    const nextState = {
      ...exercisesObject,
      [key]: { ...exercisesObject[key], [field]: value },
    };
    setExercisesObject(nextState);
  }
  const exercisesArray = Object.entries(exercisesObject).sort(
    (keyExA, keyExB) => {
      const orderA = keyExA[1].order;
      const orderB = keyExB[1].order;
      return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
    }
  );
  const exerciseFields = exercisesArray.map(([key, exercise]) => {
    const exerciseCatalogArray = exerciseCatalog.data.map(
      (exerciseObj) => exerciseObj.name
    );
    const uniqueId = `inputKey${key}`;

    return (
      <Group key={`Group${uniqueId}`}>
        <Select defaultValue={exercise.name} data={exerciseCatalogArray} />
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
          onChange={(value) =>
            setWorkoutDate(Timestamp.fromDate(value as Date))
          }
          value={workoutDate?.toDate()}
          maw={400}
        />
        {exerciseFields}
      </>
    );
  }
}
