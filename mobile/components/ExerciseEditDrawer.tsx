import { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Exercise, SetEntry } from "@shared/types";
import { lbsToKg, kgToLbs } from "@shared/lib/utils";
import { UserProfileContext } from "../app/_layout";
import { ExercisePickerModal } from "../src/components/ExercisePickerModal";
import { SetRow } from "../src/components/SetRow";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import {
  normalizeExerciseKey,
  computeStats,
  mergeLifts,
} from "@shared/core/services/exerciseHistory";
import type { Lift } from "@shared/core/services/exerciseHistory";
import { useAppTheme, type AppColors } from "../hooks/useAppTheme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  exercise: Exercise;
  exerciseKey: string;
  userId: string;
  workoutId: string;
  workoutDateStr: string;
  onSetsChange: (key: string, sets: SetEntry[]) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string,
    customExerciseId?: string,
  ) => void;
  closeHandler: (key: string) => void;
}

export function ExerciseEditDrawer({
  visible,
  onDismiss,
  exercise,
  exerciseKey,
  userId,
  workoutId,
  workoutDateStr,
  onSetsChange,
  exerciseNameChangeHandler,
  closeHandler,
}: Props) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const customExercises = ctx?.userProfile.customExercises;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [storedLifts, setStoredLifts] = useState<Lift[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  const resolvedName = exercise.customExerciseId
    ? (customExercises?.[exercise.customExerciseId]?.name ?? exercise.variant)
    : exercise.variant;
  const displayName = exercise.variant || resolvedName || "Select exercise";
  const hasExercise = !!(exercise.variant || resolvedName);

  useEffect(() => {
    if (visible && !exercise.variant) setPickerVisible(true);
  }, [visible, exercise.variant]);

  useEffect(() => {
    if (!visible || !exercise.variant) return;
    const key = normalizeExerciseKey(exercise.variant);
    if (!key) return;
    let cancelled = false;
    setHistoryLoading(true);
    setStoredLifts([]);
    FirestoreActions.fetchExerciseHistory(userId, key)
      .then((doc) => {
        if (!cancelled) setStoredLifts(doc?.allLifts ?? []);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, exercise.variant, userId]);

  // Merge the current in-session sets with the stored history before computing
  // stats, so Max / This week / Max Volume reflect what was just logged rather
  // than lagging the 30s debounced write (which may not have fired yet).
  const stats = useMemo(() => {
    const sessionLifts: Lift[] = exercise.sets
      .filter((s) => s.weightkg > 0 && s.reps > 0)
      .map((s) => ({
        weight: s.weightkg,
        reps: s.reps,
        date: workoutDateStr,
        workoutId,
      }));
    const merged = mergeLifts(storedLifts, sessionLifts, workoutId);
    return merged.length ? computeStats(merged) : null;
  }, [storedLifts, exercise.sets, workoutDateStr, workoutId]);

  function fmt(kg: number): string {
    const val = weightUnit === "lbs" ? kgToLbs(kg) : kg;
    return `${Math.round(val * 10) / 10} ${weightUnit}`;
  }

  function updateSet(index: number, field: keyof SetEntry, rawValue: string) {
    const value = parseFloat(rawValue);
    if (isNaN(value)) return;
    const updated = exercise.sets.map((s, i) => {
      if (i !== index) return s;
      if (field === "weightlbs") return { ...s, weightlbs: value, weightkg: lbsToKg(value) };
      if (field === "weightkg") return { ...s, weightkg: value, weightlbs: kgToLbs(value) };
      return { ...s, [field]: value };
    });
    onSetsChange(exerciseKey, updated);
  }

  function addSet() {
    const lastSet = exercise.sets.at(-1) ?? { reps: 0, weightlbs: 0, weightkg: 0 };
    onSetsChange(exerciseKey, [...exercise.sets, { ...lastSet }]);
  }

  function removeSet(index: number) {
    onSetsChange(exerciseKey, exercise.sets.filter((_, i) => i !== index));
  }

  function handleRemove() {
    Alert.alert("Remove Exercise", "Remove this exercise and its sets?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onDismiss();
          closeHandler(exerciseKey);
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheet}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Pressable
              style={[styles.nameButton, !hasExercise && styles.nameButtonEmpty]}
              onPress={() => setPickerVisible(true)}
            >
              <Text
                style={[styles.nameText, !hasExercise && styles.nameTextPlaceholder]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </Pressable>
            <Pressable onPress={handleRemove} style={styles.iconButton}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>

          <ExercisePickerModal
            visible={pickerVisible}
            onClose={() => {
              setPickerVisible(false);
              if (!exercise.variant) {
                closeHandler(exerciseKey);
                onDismiss();
              }
            }}
            onSelect={(name, variant, customExerciseId) => {
              exerciseNameChangeHandler(name, variant, exerciseKey, customExerciseId);
              setPickerVisible(false);
            }}
          />

          {historyLoading ? (
            <ActivityIndicator style={styles.historySpinner} />
          ) : stats ? (
            <View style={styles.statsRow}>
              <StatChip label="Max" value={fmt(stats.maxWeight)} colors={colors} />
              <StatChip label="Median" value={fmt(stats.medianWeight)} colors={colors} />
              <StatChip label="This week" value={`${stats.setsThisWeek} sets`} colors={colors} />
              {stats.bestSetReps > 0 && (
                <StatChip
                  label="Max Volume"
                  value={`${stats.bestSetReps} × ${Math.round((weightUnit === "lbs" ? kgToLbs(stats.bestSetWeight) : stats.bestSetWeight) * 10) / 10}`}
                  colors={colors}
                />
              )}
            </View>
          ) : (
            hasExercise && (
              <Text style={styles.noHistory}>No history yet</Text>
            )
          )}

          <ScrollView style={styles.setsScroll} keyboardShouldPersistTaps="handled">
            {exercise.sets.length > 0 && (
              <View style={styles.setHeader}>
                <Text style={[styles.headerLabel, styles.setNumCol]}>#</Text>
                <Text style={[styles.headerLabel, styles.setField]}>Reps</Text>
                <Text style={[styles.headerLabel, styles.setField]}>Weight ({weightUnit})</Text>
                <View style={styles.removeSpacer} />
              </View>
            )}
            {exercise.sets.map((set, index) => (
              <SetRow
                key={index}
                index={index}
                set={set}
                weightUnit={weightUnit}
                editMode={true}
                onUpdate={updateSet}
                onRemove={removeSet}
              />
            ))}
            <Pressable onPress={addSet} style={styles.addSetButton}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>
          </ScrollView>

          <Pressable onPress={onDismiss} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function StatChip({ label, value, colors }: { label: string; value: string; colors: AppColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.overlay,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      paddingBottom: 60,
      minHeight: "50%",
      maxHeight: "85%",
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: c.handle,
      borderRadius: 2,
      alignSelf: "center",
      marginVertical: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    nameButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: c.surfaceVariant,
    },
    nameButtonEmpty: { borderColor: c.border },
    nameText: { fontSize: 14, fontWeight: "600", color: c.textPrimary },
    nameTextPlaceholder: { color: c.textMuted },
    iconButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    removeText: { fontSize: 24, fontWeight: "bold", color: c.textMuted },
    historySpinner: { marginVertical: 8 },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    statChip: {
      flex: 1,
      backgroundColor: c.surfaceVariant,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
      gap: 2,
    },
    statValue: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
    statLabel: { fontSize: 10, color: c.textSecondary, textTransform: "uppercase" },
    noHistory: { fontSize: 12, color: c.textMuted, marginBottom: 12 },
    setsScroll: { flexGrow: 0 },
    setHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 4,
    },
    headerLabel: {
      fontSize: 10,
      color: c.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    setNumCol: { width: 20, textAlign: "center" },
    setField: { flex: 1 },
    removeSpacer: { width: 24 },
    addSetButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: c.surfaceVariant,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    addSetText: { fontSize: 13, fontWeight: "600", color: c.textPrimary },
    doneButton: {
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: c.accent,
      borderRadius: 8,
      alignItems: "center",
    },
    doneButtonText: { fontSize: 15, fontWeight: "600", color: c.textInverse },
  });
}
