import { useContext, useEffect, useState } from "react";
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
} from "@shared/core/services/exerciseHistory";
import type { ComputedStats } from "@shared/core/services/exerciseHistory";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  exercise: Exercise;
  exerciseKey: string;
  userId: string;
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
  onSetsChange,
  exerciseNameChangeHandler,
  closeHandler,
}: Props) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const customExercises = ctx?.userProfile.customExercises;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const resolvedName = exercise.customExerciseId
    ? (customExercises?.[exercise.customExerciseId]?.name ?? exercise.variant)
    : exercise.variant;
  const displayName = exercise.variant || resolvedName || "Select exercise";
  const hasExercise = !!(exercise.variant || resolvedName);

  useEffect(() => {
    if (!visible || !exercise.variant) return;
    const key = normalizeExerciseKey(exercise.variant);
    if (!key) return;
    setHistoryLoading(true);
    setStats(null);
    FirestoreActions.fetchExerciseHistory(userId, key)
      .then((doc) => setStats(doc ? computeStats(doc.allLifts) : null))
      .finally(() => setHistoryLoading(false));
  }, [visible, exercise.variant, userId]);

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
            onClose={() => setPickerVisible(false)}
            onSelect={(name, variant, customExerciseId) => {
              exerciseNameChangeHandler(name, variant, exerciseKey, customExerciseId);
              setPickerVisible(false);
            }}
          />

          {historyLoading ? (
            <ActivityIndicator style={styles.historySpinner} />
          ) : stats ? (
            <View style={styles.statsRow}>
              <StatChip label="Max" value={fmt(stats.maxWeight)} />
              <StatChip label="Median" value={fmt(stats.medianWeight)} />
              <StatChip label="This week" value={`${stats.setsThisWeek} sets`} />
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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
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
    backgroundColor: "#ddd",
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
    borderColor: "#ccc",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  nameButtonEmpty: { borderColor: "#ddd" },
  nameText: { fontSize: 14, fontWeight: "600", color: "#222" },
  nameTextPlaceholder: { color: "#999" },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: { fontSize: 24, fontWeight: "bold", color: "#999" },
  historySpinner: { marginVertical: 8 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  statValue: { fontSize: 14, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 10, color: "#888", textTransform: "uppercase" },
  noHistory: { fontSize: 12, color: "#aaa", marginBottom: 12 },
  setsScroll: { flexGrow: 0 },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 10,
    color: "#666",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  addSetText: { fontSize: 13, fontWeight: "600", color: "#333" },
  doneButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
