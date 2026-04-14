import { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Workout, Exercise, ExerciseMap, SetEntry } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { ExerciseRow } from "../../src/components/ExerciseRow";

const EMPTY_EXERCISE: Exercise = {
  order: 0,
  name: "",
  variant: "",
  sets: [],
};

const RESERVED_KEYS = new Set(["date", "durationSeconds"]);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function WorkoutModeScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const userId = useAppSelector((state) => state.auth.userId);
  const router = useRouter();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);

  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId]);

  // Start elapsed timer on mount
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // Rest stopwatch interval
  useEffect(() => {
    if (restRunning) {
      restRef.current = setInterval(() => {
        setRestSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (restRef.current) clearInterval(restRef.current);
    }
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [restRunning]);

  function handleRestPress() {
    if (!restRunning && restSeconds === 0) {
      setRestRunning(true);
    } else if (restRunning) {
      setRestRunning(false);
    } else {
      setRestSeconds(0);
    }
  }

  async function handleFinish() {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    await FirestoreActions.updateWorkoutById(userId, workoutId, {
      ...workout!,
      durationSeconds: elapsedSeconds,
    });
    router.replace("/workouts");
  }

  if (!workout) return null;

  const exercisesObject: ExerciseMap = Object.fromEntries(
    Object.entries(workout)
      .filter(([k]) => !RESERVED_KEYS.has(k))
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

  const restLabel = (() => {
    if (!restRunning && restSeconds === 0) return "Start Rest";
    if (restRunning) return `${formatTime(restSeconds)}  ❚❚`;
    return `${formatTime(restSeconds)}  ↺`;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <View style={styles.elapsedBox}>
          <Text style={styles.elapsedLabel}>Workout</Text>
          <Text style={styles.elapsedTime}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Pressable
          onPress={handleRestPress}
          style={[styles.restButton, restRunning && styles.restButtonActive]}
        >
          <Text style={styles.restButtonText}>{restLabel}</Text>
        </Pressable>
        <Pressable onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {Object.entries(exercisesObject).map(([key, exercise]) => (
          <ExerciseRow
            key={key}
            exercise={exercise}
            exerciseKey={key}
            onSetsChange={onSetsChange}
            closeHandler={closeHandler}
            exerciseNameChangeHandler={exerciseNameChangeHandler}
            editMode={true}
            isMobile={true}
          />
        ))}
        <TouchableOpacity onPress={addNewExercise} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    gap: 10,
  },
  elapsedBox: { flex: 1 },
  elapsedLabel: { fontSize: 11, color: "#888", textTransform: "uppercase" },
  elapsedTime: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  restButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#e8f4ff",
    alignItems: "center",
    minWidth: 110,
  },
  restButtonActive: { backgroundColor: "#cce8ff" },
  restButtonText: { fontSize: 14, fontWeight: "600", color: "#007AFF" },
  finishButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4caf50",
  },
  finishButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },
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
