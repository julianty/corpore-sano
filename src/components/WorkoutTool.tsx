import { Button, Stack, Title } from "@mantine/core";
import { WorkoutInstance } from "./WorkoutInstance";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { IconPlus } from "@tabler/icons-react";

// TODO: Add a way to read favorite workouts: create a useEffect hook that calls
// firestoreActions to read the userProfile.favoriteExercises into a provider

function AddWorkoutButton(props: { clickHandler: React.MouseEventHandler }) {
  const { clickHandler } = props;
  return (
    <Button leftSection={<IconPlus size={16} />} onClick={clickHandler}>
      Add New Workout
    </Button>
  );
}

export function WorkoutTool() {
  const [workoutIdArray, setWorkoutIdArray] = useState<Array<string>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Fetches the workout Ids from firebase
    setWorkoutIdArray([]);
    FirestoreActions.fetchWorkoutIds(userId).then((value) => {
      setWorkoutIdArray(value);
    });
    FirestoreActions.fetchFavoriteExercises(userId).then((value) => {
      dispatch({ type: `exercises/setFavoriteExercises`, payload: value });
    });
  }, [userId]);
  const workoutCloseHandler = useCallback(
    (workoutId: string) => {
      const nextState = [...workoutIdArray].filter((id) =>
        id === workoutId ? false : true
      );
      FirestoreActions.deleteWorkoutById(userId, workoutId);
      setWorkoutIdArray(nextState);
    },
    [workoutIdArray, userId]
  );

  function addEmptyWorkout(event: React.MouseEvent) {
    event.preventDefault;
    // Create empty workout document
    const newWorkoutDoc = FirestoreActions.createWorkout(userId);
    const docId = newWorkoutDoc.id;

    const nextWorkoutIdArray = [...workoutIdArray, docId];
    setWorkoutIdArray(nextWorkoutIdArray);
  }

  return (
    <Stack>
      <Title order={2}>Workout Tool</Title>
      {workoutIdArray.map((id) => {
        return (
          <WorkoutInstance
            key={`workoutId${id}`}
            workoutId={id}
            workoutCloseHandler={workoutCloseHandler}
          />
        );
      })}
      <AddWorkoutButton clickHandler={addEmptyWorkout} />
    </Stack>
  );
}
