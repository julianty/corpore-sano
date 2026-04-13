import { useContext, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Text } from "react-native";
import { Exercise, ExerciseRowProps } from "@shared/types";
import { UserProfileContext } from "../../app/_layout";
import { ExercisePickerModal } from "./ExercisePickerModal";

export function ExerciseRow({
  exercise,
  exerciseKey,
  numberFieldChangeHandler,
  closeHandler,
  exerciseNameChangeHandler,
  editMode,
}: ExerciseRowProps) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const weightField = `weight${weightUnit}` as keyof Exercise;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [setsText, setSetsText] = useState(String(exercise.sets));
  const [repsText, setRepsText] = useState(String(exercise.reps));
  const [weightText, setWeightText] = useState(String(exercise[weightField] ?? 0));

  function handleNumber(
    field: keyof Exercise,
    raw: string,
    setText: (s: string) => void
  ) {
    setText(raw);
    const value = parseFloat(raw);
    if (!isNaN(value)) numberFieldChangeHandler(value, exerciseKey, field);
  }

  const displayName = exercise.variant || exercise.name || "Select exercise";
  const hasExercise = exercise.variant || exercise.name;

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
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
      <View style={styles.fieldsRow}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Sets</Text>
          <TextInput
            style={[styles.input, styles.numInput]}
            placeholderTextColor="#999"
            value={setsText}
            onChangeText={(v) => handleNumber("sets", v, setSetsText)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reps</Text>
          <TextInput
            style={[styles.input, styles.numInput]}
            placeholderTextColor="#999"
            value={repsText}
            onChangeText={(v) => handleNumber("reps", v, setRepsText)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Weight ({weightUnit})</Text>
          <TextInput
            style={[styles.input, styles.numInput]}
            placeholderTextColor="#999"
            value={weightText}
            onChangeText={(v) => handleNumber(weightField, v, setWeightText)}
            keyboardType="numeric"
          />
        </View>
      </View>
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
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
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
  fieldGroup: { flex: 1, gap: 2 },
  fieldLabel: { fontSize: 11, color: "#666", fontWeight: "600" },
  numInput: { flex: 1 },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  closeButtonText: { fontSize: 20, fontWeight: "bold", color: "#999" },
});
