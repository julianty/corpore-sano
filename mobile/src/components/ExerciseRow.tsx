import { useContext, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Text } from "react-native";
import { ExerciseRowProps, SetEntry } from "@shared/types";
import { UserProfileContext } from "../../app/_layout";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { lbsToKg, kgToLbs } from "@shared/lib/utils";

export function ExerciseRow({
  exercise,
  exerciseKey,
  onSetsChange,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
}: ExerciseRowProps) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const [pickerVisible, setPickerVisible] = useState(false);

  const displayName = exercise.variant || exercise.name || "Select exercise";
  const hasExercise = exercise.variant || exercise.name;

  function updateSet(index: number, field: keyof SetEntry, rawValue: string) {
    const value = parseFloat(rawValue);
    if (isNaN(value)) return;
    const updated = exercise.sets.map((s, i) => {
      if (i !== index) return s;
      if (field === "weightlbs")
        return { ...s, weightlbs: value, weightkg: lbsToKg(value) };
      if (field === "weightkg")
        return { ...s, weightkg: value, weightlbs: kgToLbs(value) };
      return { ...s, [field]: value };
    });
    onSetsChange(exerciseKey, updated);
  }

  function addSet() {
    const lastSet = exercise.sets.at(-1) ?? {
      reps: 0,
      weightlbs: 0,
      weightkg: 0,
    };
    onSetsChange(exerciseKey, [...exercise.sets, { ...lastSet }]);
  }

  function removeSet(index: number) {
    onSetsChange(
      exerciseKey,
      exercise.sets.filter((_, i) => i !== index),
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <Pressable
          style={[styles.nameButton, !hasExercise && styles.nameButtonEmpty]}
          onPress={() => setPickerVisible(true)}
        >
          <Text
            style={[
              styles.nameText,
              !hasExercise && styles.nameTextPlaceholder,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </Pressable>
        <ExercisePickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={(name, variant) => {
            exerciseNameChangeHandler(name, variant, exerciseKey);
            setPickerVisible(false);
          }}
        />
        {editMode && (
          <Pressable
            onPress={() => closeHandler(exerciseKey)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        )}
      </View>

      {exercise.sets.length > 0 && (
        <View style={styles.setHeader}>
          <Text style={[styles.headerLabel, styles.setNumCol]}>#</Text>
          <Text style={[styles.headerLabel, styles.setField]}>Reps</Text>
          <Text style={[styles.headerLabel, styles.setField]}>
            Weight ({weightUnit})
          </Text>
          {editMode && <View style={styles.removeSpacer} />}
        </View>
      )}

      {exercise.sets.map((set, index) => (
        <SetRow
          key={index}
          index={index}
          set={set}
          weightUnit={weightUnit}
          editMode={editMode}
          onUpdate={updateSet}
          onRemove={removeSet}
        />
      ))}

      <Pressable onPress={addSet} style={styles.addSetButton}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

function SetRow({
  index,
  set,
  weightUnit,
  editMode,
  onUpdate,
  onRemove,
}: {
  index: number;
  set: SetEntry;
  weightUnit: "lbs" | "kg";
  editMode: boolean;
  onUpdate: (index: number, field: keyof SetEntry, rawValue: string) => void;
  onRemove: (index: number) => void;
}) {
  const weightField = `weight${weightUnit}` as keyof SetEntry;
  const [repsText, setRepsText] = useState(String(set.reps));
  const [weightText, setWeightText] = useState(String(set[weightField] ?? 0));

  function stripLeadingZero(v: string) {
    return v.replace(/^0+(\d)/, "$1");
  }

  return (
    <View style={styles.setRow}>
      <Text style={[styles.setNumLabel, styles.setNumCol]}>{index + 1}</Text>
      <TextInput
        style={[styles.input, styles.setField]}
        value={repsText}
        onChangeText={(v) => {
          const stripped = stripLeadingZero(v);
          setRepsText(stripped);
          onUpdate(index, "reps", stripped);
        }}
        keyboardType="numeric"
        placeholderTextColor="#999"
        selectTextOnFocus
      />
      <TextInput
        style={[styles.input, styles.setField]}
        value={weightText}
        onChangeText={(v) => {
          const stripped = stripLeadingZero(v);
          setWeightText(stripped);
          onUpdate(index, weightField, stripped);
        }}
        keyboardType="numeric"
        placeholderTextColor="#999"
        selectTextOnFocus
      />
      {editMode && (
        <Pressable onPress={() => onRemove(index)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>−</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nameButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#fff",
  },
  nameButtonEmpty: {
    borderColor: "#ddd",
  },
  nameText: {
    fontSize: 12,
    color: "#222",
  },
  nameTextPlaceholder: {
    color: "#999",
  },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  closeButtonText: { fontSize: 20, fontWeight: "bold", color: "#999" },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  setNumCol: {
    width: 20,
    textAlign: "center",
  },
  setNumLabel: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  setField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  removeSpacer: {
    width: 24,
  },
  addSetButton: {
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  addSetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
});
