import { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "@shared/types";
import { UserProfileContext } from "../../app/_layout";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

interface Props {
  exercise: Exercise;
  onPress: () => void;
}

export function ExerciseRow({ exercise, onPress }: Props) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const customExercises = ctx?.userProfile.customExercises;
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  const resolvedName = exercise.customExerciseId
    ? (customExercises?.[exercise.customExerciseId]?.name ?? exercise.variant)
    : exercise.variant;
  const displayName = exercise.variant || resolvedName || "Select exercise";
  const hasExercise = !!(exercise.variant || resolvedName);

  const validSets = exercise.sets.filter((s) => s.reps > 0 || s.weightlbs > 0 || s.weightkg > 0);

  function formatSet(s: (typeof validSets)[number]) {
    const weight = weightUnit === "lbs" ? s.weightlbs : Math.round(s.weightkg * 10) / 10;
    return `${s.reps} × ${weight}`;
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text
        style={[styles.name, !hasExercise && styles.namePlaceholder]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
      {validSets.length === 0 ? (
        <Text style={styles.empty}>Tap to add sets</Text>
      ) : (
        <View style={styles.setsRow}>
          {validSets.map((s, i) => (
            <View key={i} style={styles.setBadge}>
              <Text style={styles.setBadgeText}>{formatSet(s)}</Text>
            </View>
          ))}
          <Text style={styles.unit}>{weightUnit}</Text>
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 4,
      padding: 12,
      marginVertical: 4,
      backgroundColor: c.background,
      gap: 6,
    },
    name: { fontSize: 14, fontWeight: "600", color: c.textPrimary },
    namePlaceholder: { color: c.textMuted },
    empty: { fontSize: 12, color: c.textMuted },
    setsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
    },
    setBadge: {
      backgroundColor: c.surfaceVariant,
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 7,
    },
    setBadgeText: { fontSize: 12, color: c.textPrimary },
    unit: { fontSize: 11, color: c.textMuted },
  });
}
