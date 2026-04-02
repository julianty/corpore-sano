import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Button, IconButton } from "react-native-paper";
import { Workout, Exercise, ExerciseMap } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { lbsToKg, kgToLbs } from "@shared/lib/utils";
import { ExerciseRow } from "./ExerciseRow";

interface WorkoutCardProps {
  workoutId: string;
  onDelete: (id: string) => void;
}

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: 3,
  reps: 10,
  weightlbs: 0,
  weightkg: 0,
};

export function WorkoutCard({ workoutId, onDelete }: WorkoutCardProps) {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Load workout on mount
  useEffect(() => {
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId]);

  if (!workout) return null;

  const exercisesObject: ExerciseMap = Object.fromEntries(
    Object.entries(workout).filter(([k]) => k !== "date"),
  ) as ExerciseMap;

  async function saveWorkout(updated: Workout) {
    setWorkout(updated);
    await FirestoreActions.updateWorkoutById(userId, workoutId, updated);
  }

  function numberFieldChangeHandler(
    value: number,
    key: string,
    field: keyof Exercise,
  ) {
    const updated: ExerciseMap = { ...exercisesObject };
    updated[key] = { ...updated[key], [field]: value };
    if (field === "weightlbs") updated[key].weightkg = lbsToKg(value);
    if (field === "weightkg") updated[key].weightlbs = kgToLbs(value);
    saveWorkout({ ...workout!, ...updated });
  }

  function exerciseNameChangeHandler(
    name: string,
    variant: string,
    key: string,
  ) {
    const updated: ExerciseMap = { ...exercisesObject };
    updated[key] = { ...updated[key], name, variant };
    saveWorkout({ ...workout!, ...updated });
  }

  function closeHandler(key: string) {
    const updated = { ...workout! };
    delete (updated as Record<string, unknown>)[key];
    saveWorkout(updated);
  }

  function addNewExercise() {
    const key = `exercise_${Date.now()}`;
    const updated: ExerciseMap = {
      ...exercisesObject,
      [key]: { ...EMPTY_EXERCISE, order: Object.keys(exercisesObject).length },
    };
    saveWorkout({ ...workout!, ...updated });
  }

  const dateLabel = workout.date
    ? workout.date.toDate().toLocaleDateString()
    : "No date";

  return (
    <Card style={styles.card}>
      <Card.Title
        title={dateLabel}
        right={() => (
          <View style={styles.cardActions}>
            <IconButton
              icon={editMode ? "check" : "pencil"}
              onPress={() => setEditMode((e) => !e)}
            />
            <IconButton icon="delete" onPress={() => onDelete(workoutId)} />
          </View>
        )}
      />
      <Card.Content>
        <ScrollView>
          {Object.entries(exercisesObject).map(([key, exercise]) => (
            <ExerciseRow
              key={key}
              exercise={exercise}
              exerciseKey={key}
              numberFieldChangeHandler={numberFieldChangeHandler}
              closeHandler={closeHandler}
              exerciseNameChangeHandler={exerciseNameChangeHandler}
              editMode={editMode}
            />
          ))}
        </ScrollView>
        {editMode && (
          <Button
            mode="outlined"
            icon="plus"
            onPress={addNewExercise}
            style={styles.addButton}
          >
            Add Exercise
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8 },
  cardActions: { flexDirection: "row" },
  addButton: { marginTop: 8 },
});
