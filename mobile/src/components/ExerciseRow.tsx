import { useContext } from "react";
import { View, StyleSheet, TextInput, Pressable, Text } from "react-native";
import { Exercise, ExerciseRowProps } from "@shared/types";
import { UserProfileContext } from "../../app/_layout";

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

  function handleNumber(field: keyof Exercise, raw: string) {
    const value = parseFloat(raw);
    if (!isNaN(value)) numberFieldChangeHandler(value, exerciseKey, field);
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, styles.nameInput]}
        placeholder="Exercise"
        placeholderTextColor="#999"
        value={exercise.name}
        onChangeText={(name) =>
          exerciseNameChangeHandler(name, exercise.variant, exerciseKey)
        }
      />
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
      {editMode && (
        <Pressable
          onPress={() => closeHandler(exerciseKey)}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
  },
  nameInput: { flex: 2 },
  numInput: { flex: 1, minWidth: 60 },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  closeButtonText: { fontSize: 20, fontWeight: "bold", color: "#999" },
});
