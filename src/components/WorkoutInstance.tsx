import { Group, TextInput, NumberInput, Button } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import app from "../initializeFirebase";
import { getFirestore, doc, getDoc, DocumentData } from "firebase/firestore";
import { useAppSelector } from "../hooks";
import { useEffect, useId, useState } from "react";
const FirestoreActions = {
  // Might need to throw this out in the case where I only upload specific
  // entires as they change instead of amending the whole user file?
  // maybe it's managable by using the {merge: true} option
  upload: async (userId: string) => {
    const db = getFirestore(app);
    const docRef = doc(db, "users", userId);
    // const docSnap = await getDoc(docRef);
    console.log("saving Data");
  },
  fetchData: async (userId: string) => {
    const db = getFirestore(app);
    const data = await getDoc(
      doc(db, "users", userId, "workouts", "workout001")
    );
    return data.data();
  },
};

const demoData = {
  workoutDate: new Date(),
  // should the exercises structure be an object rather than an array?
  exercises: [
    { name: "Lateral Raise", sets: 2, reps: 10, weight: 30 },
    { name: "Back Squat", sets: 1, reps: 3, weight: 100 },
  ],
};

export function WorkoutInstance() {
  const [exercisesArray, setExercisesArray] = useState<Array<object>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  useEffect(() => {
    FirestoreActions.fetchData(userId).then((value) => {
      const resultObject = value as object;
      console.log(Object.values(resultObject));
      setExercisesArray(Object.values(resultObject));
      // Object.values(resultObject).map((val) => console.log(val));
      // console.log(Object.keys(resultObject).map((key) => resultObject[key]));
      // setExercisesArray(resultObject["exercise001"]);
      // console.log(typeof Object.values(resultObject));
      // Object.values(workoutData).map((val) => console.log(val));
    });
  }, [userId]);
  function changeHandler() {
    console.log("Changed");
  }
  // const exerciseFields = demoData.exercises.map((_, index) => {
  //   const uniqueId = `inputKey${index}`;
  //   return (
  //     <Group key={`Group${uniqueId}`}>
  //       {/* Need to change this input to a dropdown after I have the exercise
  //       catalog in place */}
  //       <TextInput
  //         key={`${uniqueId}name`}
  //         defaultValue={demoData.exercises[index].name}
  //       />
  //       <NumberInput
  //         key={`${uniqueId}sets`}
  //         defaultValue={demoData.exercises[index].sets}
  //         onChange={changeHandler}
  //       />
  //       <NumberInput
  //         key={`${uniqueId}reps`}
  //         defaultValue={demoData.exercises[index].reps}
  //       />
  //       <NumberInput
  //         key={`${uniqueId}weight`}
  //         defaultValue={demoData.exercises[index].weight}
  //       />
  //     </Group>
  //   );
  // });
  const exerciseFields = exercisesArray.map((_, index) => {
    const uniqueId = `inputKey${index}`;
    return (
      <Group key={`Group${uniqueId}`}>
        {/* Need to change this input to a dropdown after I have the exercise
        catalog in place */}
        <TextInput
          key={`${uniqueId}name`}
          defaultValue={demoData.exercises[index].name}
        />
        <NumberInput
          key={`${uniqueId}sets`}
          defaultValue={demoData.exercises[index].sets}
          onChange={changeHandler}
        />
        <NumberInput
          key={`${uniqueId}reps`}
          defaultValue={demoData.exercises[index].reps}
        />
        <NumberInput
          key={`${uniqueId}weight`}
          defaultValue={demoData.exercises[index].weight}
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
