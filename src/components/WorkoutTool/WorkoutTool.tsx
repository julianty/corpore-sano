import { Button, Stack, Title } from "@mantine/core";
import { WorkoutInstance } from "./WorkoutInstance";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  FirestoreActions,
  WorkoutPageCursor,
} from "../../helperFunctions/FirestoreActions";
import { IconPlus } from "@tabler/icons-react";
import { WorkoutEntry } from "../../types";

const PAGE_SIZE = 14;

function AddWorkoutButton(props: { clickHandler: React.MouseEventHandler }) {
  const { clickHandler } = props;
  return (
    <Button
      leftSection={<IconPlus size={16} />}
      onClick={clickHandler}
      size="lg"
      w={"50%"}
    >
      Add New Workout
    </Button>
  );
}

export function WorkoutTool() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [cursor, setCursor] = useState<WorkoutPageCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAppSelector((state) => state.auth.userId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setWorkouts([]);
    setCursor(null);
    setHasMore(true);
    setIsLoading(true);

    FirestoreActions.fetchWorkoutsPaginated(userId, PAGE_SIZE)
      .then((result) => {
        setWorkouts(result.workouts);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      })
      .finally(() => setIsLoading(false));

    FirestoreActions.fetchFavoriteExercises(userId).then((value) => {
      dispatch({ type: "exercises/setFavoriteExercises", payload: value });
    });
  }, [userId, dispatch]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);

    FirestoreActions.fetchWorkoutsPaginated(userId, PAGE_SIZE, cursor)
      .then((result) => {
        setWorkouts((prev) => [...prev, ...result.workouts]);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      })
      .finally(() => setIsLoading(false));
  }, [userId, cursor, hasMore, isLoading]);

  const workoutCloseHandler = useCallback(
    (workoutId: string) => {
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      FirestoreActions.deleteWorkoutById(userId, workoutId);
    },
    [userId],
  );

  function addEmptyWorkout(event: React.MouseEvent) {
    event.preventDefault();
    const newWorkoutDoc = FirestoreActions.createWorkout(userId);
    const docId = newWorkoutDoc.id;

    const newEntry: WorkoutEntry = {
      id: docId,
      data: { date: undefined },
    };
    setWorkouts((prev) => [newEntry, ...prev]);
  }

  return (
    <Stack>
      <Title order={2}>Workout Tool</Title>
      <AddWorkoutButton clickHandler={addEmptyWorkout} />
      {workouts.map((entry) => (
        <WorkoutInstance
          key={`workoutId${entry.id}`}
          workoutId={entry.id}
          initialData={entry.data}
          workoutCloseHandler={workoutCloseHandler}
        />
      ))}
      {hasMore && (
        <Button
          onClick={loadMore}
          loading={isLoading}
          variant="light"
          size="lg"
          w="50%"
        >
          Load More Workouts
        </Button>
      )}
    </Stack>
  );
}
