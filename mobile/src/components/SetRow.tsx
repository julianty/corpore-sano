import { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import type { SetEntry } from "@shared/types";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

interface Props {
  index: number;
  set: SetEntry;
  weightUnit: "lbs" | "kg";
  editMode: boolean;
  onUpdate: (index: number, field: keyof SetEntry, rawValue: string) => void;
  onRemove: (index: number) => void;
}

export function SetRow({ index, set, weightUnit, editMode, onUpdate, onRemove }: Props) {
  const weightField = `weight${weightUnit}` as keyof SetEntry;
  const [repsText, setRepsText] = useState(String(set.reps));
  const [weightText, setWeightText] = useState(String(set[weightField] ?? 0));
  const colors = useAppTheme();
  const styles = makeStyles(colors);

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
        placeholderTextColor={colors.textMuted}
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
        placeholderTextColor={colors.textMuted}
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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
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
      color: c.textSecondary,
    },
    setField: {
      flex: 1,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 4,
      padding: 8,
      fontSize: 12,
      color: c.textPrimary,
    },
    removeButton: {
      width: 24,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    removeButtonText: {
      fontSize: 18,
      color: c.textMuted,
      fontWeight: "bold",
    },
  });
}
