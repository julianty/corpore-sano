import { Group, TextInput, NumberInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useEffect, useState } from "react";
import { Exercise, ExerciseMap, Workout } from "../types";
import { FirestoreActions } from "./FirestoreActions";
import { Timestamp } from "firebase/firestore";

export function WorkoutInstance(props: { workoutId: string }) {
  const { workoutId } = props;

  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
  const [exercisesObject, setExercisesObject] = useState<ExerciseMap>({});

  const userId = useAppSelector((state) => state.auth.userId);

  useEffect(() => {
    FirestoreActions.fetchData(userId).then((value) => {
      const resultObject = value as Workout;
      const { date, ...exercises } = resultObject;
      setWorkoutDate(date);
      setExercisesObject(exercises as ExerciseMap);
    });
  }, [userId]);

  useEffect(() => {
    if (Object.keys(exercisesObject).length !== 0) {
      const updatedDoc: Workout = {
        date: workoutDate,
        ...exercisesObject,
      };
      FirestoreActions.updateWorkoutById(userId, workoutId, updatedDoc);
    }
  }, [exercisesObject, workoutDate, userId, workoutId]);

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
  const exerciseFields = Object.entries(exercisesObject as object).map(
    ([key, exercise]) => {
      const uniqueId = `inputKey${key}`;
      return (
        <Group key={`Group${uniqueId}`}>
          {/* Need to change this input to a dropdown after I have the exercise
        catalog in place */}
          <TextInput key={`${uniqueId}name`} defaultValue={exercise.name} />
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
    }
  );
  if (typeof exercisesObject !== "undefined") {
    return (
      <form>
        <DateInput value={workoutDate?.toDate()} />
        {exerciseFields}
      </form>
    );
  }
}
