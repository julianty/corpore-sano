import { Group, TextInput, NumberInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useEffect, useState } from "react";
import { Exercise, Workout } from "../types";
import { FirestoreActions } from "./FirestoreActions";
import { Timestamp } from "firebase/firestore";
const demoData = {
  workoutDate: new Date(),
  // should the exercises structure be an object rather than an array?
  exercises: [
    { name: "Lateral Raise", sets: 2, reps: 10, weight: 30 },
    { name: "Back Squat", sets: 1, reps: 3, weight: 100 },
  ],
};

export function WorkoutInstance(props: { workoutId: string }) {
  const { workoutId } = props;
  const [workoutDate, setWorkoutDate] = useState<Timestamp>();
  const [exercisesArray, setExercisesArray] = useState<Array<Exercise>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  useEffect(() => {
    FirestoreActions.fetchData(userId).then((value) => {
      const resultObject = value as Workout;
      const { date, ...exercises } = resultObject;
      setWorkoutDate(date);
      setExercisesArray(Object.values(exercises));
    });
  }, [userId]);

  function changeHandler(value: string | number, field: string) {
    console.log(value);
    FirestoreActions.updateWorkoutById(userId, workoutId);
  }
  const exerciseFields = exercisesArray.map((_, index) => {
    const uniqueId = `inputKey${index}`;
    return (
      <Group key={`Group${uniqueId}`}>
        {/* Need to change this input to a dropdown after I have the exercise
        catalog in place */}
        <TextInput
          key={`${uniqueId}name`}
          defaultValue={exercisesArray[index].name}
        />
        <NumberInput
          key={`${uniqueId}sets`}
          defaultValue={exercisesArray[index].sets}
          onChange={(value) => changeHandler(value, "sets")}
        />
        <NumberInput
          key={`${uniqueId}reps`}
          defaultValue={exercisesArray[index].reps}
        />
        <NumberInput
          key={`${uniqueId}weight`}
          defaultValue={exercisesArray[index].weight}
        />
      </Group>
    );
  });
  if (typeof exercisesArray !== "undefined") {
    return (
      <form>
        <DateInput value={workoutDate?.toDate()} />
        {exerciseFields}
      </form>
    );
  }
}
