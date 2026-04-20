import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { Workout, Exercise, ExerciseMap, SetEntry } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { ExerciseRow } from "../../../src/components/ExerciseRow";

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: [],
};

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const userId = useAppSelector((state) => state.auth.userId);
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    customExerciseId?: string,
  ) {
    const updated: ExerciseMap = { ...exercisesObject };
    updated[key] = { ...updated[key], name, variant, customExerciseId };
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

  const dateLabel = (() => {
    if (!workout.date) return "No date";
    const d = workout.date.toDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return `${month} ${d.getDate()}, ${weekday}`;
  })();

  function startWorkoutMode() {
    router.push(`/workout-mode/${workoutId}`);
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <View style={styles.subHeader}>
        <View style={styles.dateRow}>
          {editMode ? (
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dateLabel, styles.editableDate]}>
                {dateLabel} ✎
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.dateLabel}>{dateLabel}</Text>
          )}
        </View>
        <Pressable
          onPress={() => {
            setEditMode((e) => !e);
            setShowDatePicker(false);
          }}
          style={[styles.actionButton, editMode && styles.actionButtonActive]}
        >
          <Text
            style={
              editMode
                ? styles.actionButtonTextColored
                : styles.actionButtonText
            }
          >
            {editMode ? "Done" : "Edit"}
          </Text>
        </Pressable>
        <Pressable onPress={startWorkoutMode} style={styles.workoutModeButton}>
          <Text style={styles.actionButtonTextColored}>▶ Resume</Text>
        </Pressable>
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

      <ScrollView contentContainerStyle={styles.content}>
        {Object.entries(exercisesObject)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([key, exercise]) => (
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
        {editMode && (
          <TouchableOpacity onPress={addNewExercise} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dateRow: { flex: 1 },
  dateLabel: { fontSize: 18, fontWeight: "600" },
  editableDate: { color: "#007AFF" },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  actionButtonActive: { backgroundColor: "#4caf50" },
  actionButtonText: { fontSize: 13, fontWeight: "600", color: "#333" },
  actionButtonTextColored: { fontSize: 13, fontWeight: "600", color: "#fff" },
  workoutModeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
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
  content: { padding: 12, paddingBottom: 40 },
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
