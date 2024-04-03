import { Button, Stack, Title } from "@mantine/core";
import { WorkoutInstance } from "../components/WorkoutInstance";
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { FirestoreActions } from "../helperFunctions/FirestoreActions";
import { IconPlus } from "@tabler/icons-react";

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
  useEffect(() => {
    // Fetches the workout Ids from firebase
    setWorkoutIdArray([]);
    FirestoreActions.fetchWorkoutIds(userId).then((value) => {
      setWorkoutIdArray(value);
    });
  }, [userId]);
  const workoutCloseHandler = useCallback(
    (workoutId: string) => {
      const nextState = [...workoutIdArray].filter((id) =>
        id === workoutId ? false : true
      );
      console.log(nextState, workoutId);
      FirestoreActions.deleteWorkoutById(userId, workoutId);
      setWorkoutIdArray(nextState);
    },
    [workoutIdArray]
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
    <Stack p={{ sm: "sm", md: "lg" }}>
      <Title order={2}>Workout Tool</Title>
      {/* {Object.values(workoutsObject).map()} */}
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
