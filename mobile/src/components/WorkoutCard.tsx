import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { Workout, Exercise, ExerciseMap, SetEntry } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { ExerciseRow } from "./ExerciseRow";

interface WorkoutCardProps {
  workoutId: string;
  onDelete: (id: string) => void;
}

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: [],
};

export function WorkoutCard({ workoutId, onDelete }: WorkoutCardProps) {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load workout on mount
  useEffect(() => {
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId]);

  if (!workout) return null;

  const exercisesObject: ExerciseMap = Object.fromEntries(
    Object.entries(workout)
      .filter(([k]) => k !== "date")
      .map(([k, v]) => {
        const ex = v as Exercise;
        return [k, Array.isArray(ex.sets) ? ex : { ...ex, sets: [] }];
      }),
  ) as ExerciseMap;

  async function saveWorkout(updated: Workout) {
    setWorkout(updated);
    await FirestoreActions.updateWorkoutById(userId, workoutId, updated);
  }

  function onSetsChange(key: string, sets: SetEntry[]) {
    const updated: ExerciseMap = { ...exercisesObject };
    updated[key] = { ...updated[key], sets };
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

  function handleDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      saveWorkout({ ...workout!, date: Timestamp.fromDate(selectedDate) });
    }
  }

  const dateLabel = workout.date
    ? workout.date.toDate().toLocaleDateString()
    : "No date";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {editMode ? (
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.cardTitle, styles.editableDate]}>
              {dateLabel} ✎
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.cardTitle}>{dateLabel}</Text>
        )}
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => {
              setEditMode((e) => !e);
              setShowDatePicker(false);
            }}
            style={[styles.actionButton, editMode && styles.actionButtonActive]}
          >
            <Text style={editMode ? styles.actionButtonTextColored : styles.actionButtonText}>{editMode ? "Done" : "Edit"}</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(workoutId)}
            style={[styles.actionButton, styles.actionButtonDanger]}
          >
            <Text style={styles.actionButtonTextColored}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={workout.date ? workout.date.toDate() : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
          />
          {Platform.OS === "ios" && (
            <Pressable
              onPress={() => setShowDatePicker(false)}
              style={styles.datePickerDone}
            >
              <Text style={styles.actionButtonTextColored}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.cardContent}>
        <View>
          {Object.entries(exercisesObject).map(([key, exercise]) => (
            <ExerciseRow
              key={key}
              exercise={exercise}
              exerciseKey={key}
              onSetsChange={onSetsChange}
              closeHandler={closeHandler}
              exerciseNameChangeHandler={exerciseNameChangeHandler}
              editMode={editMode}
              isMobile={true}
            />
          ))}
        </View>
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
  editableDate: { color: "#007AFF" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  actionButtonActive: {
    backgroundColor: "#4caf50",
  },
  actionButtonDanger: {
    backgroundColor: "#f44336",
  },
  actionButtonText: { fontSize: 13, fontWeight: "600", color: "#333" },
  actionButtonTextColored: { fontSize: 13, fontWeight: "600", color: "#fff" },
  cardContent: { padding: 12 },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
    paddingBottom: 8,
  },
  datePickerDone: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
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
