import { useState } from "react";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { useAppTheme, useAppScheme, type AppColors } from "../hooks/useAppTheme";

interface Props {
  date: Timestamp | undefined;
  onDateChange: (date: Date) => void;
}

export function WorkoutDatePicker({ date, onDateChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const colors = useAppTheme();
  const scheme = useAppScheme();
  const styles = makeStyles(colors);

  const dateLabel = (() => {
    if (!date) return "No date";
    const d = date.toDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return `${month} ${d.getDate()}, ${weekday}`;
  })();

  function handleChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selectedDate) onDateChange(selectedDate);
  }

  return (
    <>
      <View style={styles.subHeader}>
        <Pressable onPress={() => setShowPicker(true)}>
          <Text style={[styles.dateLabel, styles.editableDate]}>{dateLabel} ✎</Text>
        </Pressable>
      </View>
      {showPicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={date ? date.toDate() : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            themeVariant={scheme}
            onChange={handleChange}
          />
          {Platform.OS === "ios" && (
            <Pressable onPress={() => setShowPicker(false)} style={styles.datePickerDone}>
              <Text style={styles.datePickerDoneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    subHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    dateLabel: { fontSize: 18, fontWeight: "600", color: c.textPrimary },
    editableDate: { color: c.accent },
    datePickerContainer: {
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      alignItems: "center",
      paddingBottom: 8,
    },
    datePickerDone: {
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 20,
      backgroundColor: c.accent,
      borderRadius: 6,
    },
    datePickerDoneText: { fontSize: 13, fontWeight: "600", color: c.textInverse },
  });
}
