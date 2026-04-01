import { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, IconButton, Text } from "react-native-paper";
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
        style={styles.nameInput}
        label="Exercise"
        value={exercise.name}
        onChangeText={(name) =>
          exerciseNameChangeHandler(name, exercise.variant, exerciseKey)
        }
        dense
      />
      <TextInput
        style={styles.numInput}
        label="Sets"
        value={String(exercise.sets)}
        onChangeText={(v) => handleNumber("sets", v)}
        keyboardType="numeric"
        dense
      />
      <TextInput
        style={styles.numInput}
        label="Reps"
        value={String(exercise.reps)}
        onChangeText={(v) => handleNumber("reps", v)}
        keyboardType="numeric"
        dense
      />
      <TextInput
        style={styles.numInput}
        label={weightUnit}
        value={String(exercise[weightField] ?? 0)}
        onChangeText={(v) => handleNumber(weightField, v)}
        keyboardType="numeric"
        dense
      />
      {editMode && (
        <IconButton
          icon="close"
          size={18}
          onPress={() => closeHandler(exerciseKey)}
        />
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
  nameInput: { flex: 2 },
  numInput: { flex: 1, minWidth: 60 },
});
