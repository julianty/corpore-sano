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

  function handleNumber(field: keyof Exercise, raw: string) {
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
        <TextInput
          style={[styles.input, styles.numInput]}
          placeholder="Sets"
          placeholderTextColor="#999"
          value={String(exercise.sets)}
          onChangeText={(v) => handleNumber("sets", v)}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.numInput]}
          placeholder="Reps"
          placeholderTextColor="#999"
          value={String(exercise.reps)}
          onChangeText={(v) => handleNumber("reps", v)}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.numInput]}
          placeholder={weightUnit}
          placeholderTextColor="#999"
          value={String(exercise[weightField] ?? 0)}
          onChangeText={(v) => handleNumber(weightField, v)}
          keyboardType="numeric"
        />
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
  numInput: { flex: 1, minWidth: 60 },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  closeButtonText: { fontSize: 20, fontWeight: "bold", color: "#999" },
});
