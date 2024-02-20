import { Group, TextInput, NumberInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useAppSelector } from "../hooks";
import { useEffect, useState } from "react";
import { Exercise } from "../types";
import { FirestoreActions } from "./FirestoreActions";
const demoData = {
  workoutDate: new Date(),
  // should the exercises structure be an object rather than an array?
  exercises: [
    { name: "Lateral Raise", sets: 2, reps: 10, weight: 30 },
    { name: "Back Squat", sets: 1, reps: 3, weight: 100 },
  ],
};

export function WorkoutInstance({ workoutId: string }) {
  const [exercisesArray, setExercisesArray] = useState<Array<Exercise>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  useEffect(() => {
    FirestoreActions.fetchData(userId).then((value) => {
      const resultObject = value as object;
      setExercisesArray(Object.values(resultObject));
    });
  }, [userId]);

  function changeHandler() {
    FirestoreActions.update(userId);
  }
  const exerciseFields = exercisesArray.map((item, index) => {
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
          onChange={changeHandler}
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
        <DateInput value={demoData.workoutDate} />
        {exerciseFields}
      </form>
    );
  }
}
