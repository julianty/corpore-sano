import { Button, Title } from "@mantine/core";
import { WorkoutInstance } from "../components/WorkoutInstance";
import { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../components/FirestoreActions";

function AddWorkoutButton(props: { clickHandler: React.MouseEventHandler }) {
  const { clickHandler } = props;
  return <Button onClick={clickHandler}>Add New Workout</Button>;
}

export function WorkoutTool() {
  const [workoutIdArray, setWorkoutIdArray] = useState<Array<string>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [workouts, setWorkouts] = useState<Array<React.ReactElement>>([]);

  useEffect(() => {
    // Fetches the workout Ids from firebase
    setWorkoutIdArray([]);
    FirestoreActions.fetchWorkoutIds(userId).then((value) => {
      setWorkoutIdArray(value);
    });
  }, [userId]);

  useEffect(() => {
    setWorkouts(
      workoutIdArray.map((workoutId) => (
        <WorkoutInstance key={`workoutId${workoutId}`} workoutId={workoutId} />
      ))
    );
  }, [workoutIdArray]);

  function addEmptyWorkout(event: React.MouseEvent) {
    event.preventDefault;
    // Create empty workout document
    const newWorkoutDoc = FirestoreActions.createWorkout(userId);
    const docId = newWorkoutDoc.id;
    setWorkouts([
      ...workouts,
      <WorkoutInstance key={`workoutId${docId}`} workoutId={docId} />,
    ]);
  }
  return (
    <div>
      <Title>Workout Tool</Title>
      {workouts}
      <AddWorkoutButton clickHandler={addEmptyWorkout} />
    </div>
  );
}
