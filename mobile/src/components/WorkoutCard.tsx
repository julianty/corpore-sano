import { useState, useEffect, useContext } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Workout, Exercise } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { UserProfileContext } from "../../app/_layout";

interface WorkoutCardProps {
  workoutId: string;
  refreshKey?: number;
  onDelete: (id: string) => void;
  onPress: () => void;
}

export function WorkoutCard({
  workoutId,
  refreshKey,
  onDelete,
  onPress,
}: WorkoutCardProps) {
  const userId = useAppSelector((state) => state.auth.userId);
  const ctx = useContext(UserProfileContext);
  const customExercises = ctx?.userProfile.customExercises;
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId, refreshKey]);

  if (!workout) return null;

  const exerciseNames = Object.entries(workout)
    .filter(([k]) => k !== "date" && k !== "durationSeconds")
    .sort(([, a], [, b]) => (a as Exercise).order - (b as Exercise).order)
    .map(([, v]) => {
      const ex = v as Exercise;
      if (ex.customExerciseId) {
        return customExercises?.[ex.customExerciseId]?.name ?? ex.name;
      }
      return ex.name;
    })
    .filter(Boolean);

  const durationLabel = workout.durationSeconds
    ? `${Math.round(workout.durationSeconds / 60)} min`
    : null;

  const dateLabel = (() => {
    if (!workout.date) return "No date";
    const d = workout.date.toDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return `${month} ${d.getDate()}, ${weekday}`;
  })();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{dateLabel}</Text>
          {durationLabel && (
            <Text style={styles.durationLabel}>{durationLabel}</Text>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete(workoutId);
          }}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
      <View style={styles.cardContent}>
        {exerciseNames.length === 0 ? (
          <Text style={styles.emptyText}>No exercises yet</Text>
        ) : (
          exerciseNames.map((name, i) => (
            <Text key={i} style={styles.exerciseName}>
              {name}
            </Text>
          ))
        )}
      </View>
    </Pressable>
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
  durationLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#f44336",
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  cardContent: { padding: 12 },
  emptyText: { fontSize: 14, color: "#999", fontStyle: "italic" },
  exerciseName: { fontSize: 14, color: "#333", marginBottom: 2 },
});
