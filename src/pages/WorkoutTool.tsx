import { Button, Title } from "@mantine/core";
import { WorkoutInstance } from "../components/WorkoutInstance";
import { useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../components/FirestoreActions";
import { WorkoutsObject } from "../types";
function AddWorkoutButton(props: { clickHandler: React.MouseEventHandler }) {
  const { clickHandler } = props;
  return <Button onClick={clickHandler}>Add New Workout</Button>;
}

export function WorkoutTool() {
  const [workoutIdArray, setWorkoutIdArray] = useState<Array<string>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [workoutsObject, setWorkoutsObject] = useState<WorkoutsObject>({});
  useEffect(() => {
    // Fetches the workout Ids from firebase
    setWorkoutIdArray([]);
    FirestoreActions.fetchWorkoutIds(userId).then((value) => {
      setWorkoutIdArray(value);
    });
  }, [userId]);

  useEffect(() => {
    const workoutsObject: WorkoutsObject = {};
    workoutIdArray.forEach((id) => {
      workoutsObject[id] = (
        <WorkoutInstance
          key={`workoutId${id}`}
          workoutId={id}
          workoutCloseHandler={workoutCloseHandler}
        />
      );
    });
    setWorkoutsObject(workoutsObject);
  }, [workoutIdArray]);

  function addEmptyWorkout(event: React.MouseEvent) {
    event.preventDefault;
    // Create empty workout document
    const newWorkoutDoc = FirestoreActions.createWorkout(userId);
    const docId = newWorkoutDoc.id;

    const nextWorkoutsObject = { ...workoutsObject };
    (nextWorkoutsObject[docId] = (
      <WorkoutInstance
        key={`workoutId${docId}`}
        workoutId={docId}
        workoutCloseHandler={workoutCloseHandler}
      />
    )),
      setWorkoutsObject(nextWorkoutsObject);
  }

  function workoutCloseHandler(workoutId: string) {
    const nextState = { ...workoutsObject };
    delete nextState[workoutId];
    setWorkoutsObject(nextState);
  }
  return (
    <div>
      <Title>Workout Tool</Title>
      {Object.values(workoutsObject)}
      <AddWorkoutButton clickHandler={addEmptyWorkout} />
    </div>
  );
}
