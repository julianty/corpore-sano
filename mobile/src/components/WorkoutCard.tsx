import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{dateLabel}</Text>
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => setEditMode((e) => !e)}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>{editMode ? "✓" : "✏"}</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(workoutId)}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>🗑</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.cardContent}>
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
              isMobile={true}
            />
          ))}
        </ScrollView>
        {editMode && (
          <TouchableOpacity onPress={addNewExercise} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8 },
  iconButton: { padding: 4 },
  iconButtonText: { fontSize: 16 },
  cardContent: { padding: 12 },
  addButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
});
