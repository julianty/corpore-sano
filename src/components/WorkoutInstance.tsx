import { Group, TextInput, NumberInput, Button } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import app from "../initializeFirebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const FirestoreActions = {
  upload: async () => {
    const db = getFirestore(app);
    const docRef = doc(db, "users", "adminUser");
    const docSnap = await getDoc(docRef);
    console.log(docSnap);
  },
  fetchData: async () => {
    const db = getFirestore(app);
    const user = "demoUser";
    const data = await getDoc(doc(db, "users", user));
    console.log(data.data());
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
  function changeHandler() {
    console.log("Changed");
  }
  const exerciseFields = demoData.exercises.map((_, index) => {
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
  return (
    <form>
      <DateInput value={demoData.workoutDate} />
      {exerciseFields}
    </form>
  );
}
