import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAppSelector } from "@shared/hooks";
import { ExerciseRow } from "../../../src/components/ExerciseRow";
import { ExerciseEditDrawer } from "../../../components/ExerciseEditDrawer";
import { WorkoutDatePicker } from "../../../components/WorkoutDatePicker";
import { useWorkoutEditor } from "../../../hooks/useWorkoutEditor";
import { useAppTheme, type AppColors } from "../../../hooks/useAppTheme";

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const userId = useAppSelector((state) => state.auth.userId);
  const {
    workout,
    exercisesObject,
    onSetsChange,
    exerciseNameChangeHandler,
    closeHandler,
    addNewExercise,
    onDateChange,
  } = useWorkoutEditor(userId, workoutId);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  if (!workout) return null;

  const activeExercise = activeKey ? exercisesObject[activeKey] : null;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <WorkoutDatePicker date={workout.date} onDateChange={onDateChange} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {Object.entries(exercisesObject)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([key]) => (
            <ExerciseRow
              key={key}
              exercise={exercisesObject[key]}
              onPress={() => setActiveKey(key)}
            />
          ))}
        <TouchableOpacity onPress={() => { const key = addNewExercise(); if (key) setActiveKey(key); }} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {activeKey && activeExercise && (
        <ExerciseEditDrawer
          visible={true}
          onDismiss={() => setActiveKey(null)}
          exercise={activeExercise}
          exerciseKey={activeKey}
          userId={userId}
          onSetsChange={onSetsChange}
          exerciseNameChangeHandler={exerciseNameChangeHandler}
          closeHandler={(key) => {
            setActiveKey(null);
            closeHandler(key);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    content: { padding: 12, paddingBottom: 40 },
    addButton: {
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: c.surfaceVariant,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    addButtonText: { fontSize: 14, fontWeight: "600", color: c.textPrimary },
  });
}
