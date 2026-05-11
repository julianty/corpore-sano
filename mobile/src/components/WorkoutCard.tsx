import { useState, useEffect, useContext } from "react";
import { Alert, View, StyleSheet, Text, Pressable } from "react-native";
import { Workout } from "@shared/types";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { UserProfileContext } from "../../app/_layout";
import exerciseCatalogUpdated from "@shared/data/exerciseCatalogUpdated";
import { createExerciseMap } from "@shared/utils/exerciseLookup";
import { buildMuscleSummary, rollupToParentGroups } from "@shared/core/services/muscleCalculations";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

const exerciseMap = createExerciseMap(exerciseCatalogUpdated.data);

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
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    FirestoreActions.fetchData(userId, workoutId).then((data) => {
      if (data) setWorkout(data as Workout);
    });
  }, [userId, workoutId, refreshKey]);

  if (!workout) return null;

  const muscleGroupLabel = (() => {
    const summary = buildMuscleSummary([workout], exerciseMap, () => 0, undefined, customExercises);
    const rolled = rollupToParentGroups(summary);
    return Object.entries(rolled)
      .filter(([, v]) => v.sets > 0)
      .sort(([, a], [, b]) => b.sets - a.sets)
      .map(([group]) => group)
      .join(", ");
  })();

  const durationLabel = workout.durationSeconds
    ? `${Math.round(workout.durationSeconds / 60)} min`
    : null;

  const { dateLabel, isToday } = (() => {
    if (!workout.date) return { dateLabel: "No date", isToday: false };
    const d = workout.date.toDate();
    const now = new Date();
    const today =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return { dateLabel: `${month} ${d.getDate()}, ${weekday}`, isToday: today };
  })();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{dateLabel}</Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>
          {durationLabel && (
            <Text style={styles.durationLabel}>{durationLabel}</Text>
          )}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert("Delete Workout", "Delete this workout? This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(workoutId) },
            ]);
          }}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
      <View style={styles.cardContent}>
        {muscleGroupLabel ? (
          <Text style={styles.muscleGroupLabel}>{muscleGroupLabel}</Text>
        ) : (
          <Text style={styles.emptyText}>No exercises yet</Text>
        )}
      </View>
    </Pressable>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: "600", color: c.textPrimary },
    todayBadge: {
      backgroundColor: c.accentSubtle,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    todayBadgeText: { fontSize: 11, fontWeight: "600", color: c.accent },
    durationLabel: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    deleteButton: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 4,
      backgroundColor: c.dangerBg,
    },
    deleteButtonText: { fontSize: 13, fontWeight: "600", color: c.textInverse },
    cardContent: { padding: 12 },
    emptyText: { fontSize: 14, color: c.textMuted, fontStyle: "italic" },
    muscleGroupLabel: { fontSize: 14, color: c.textSecondary },
  });
}
