import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAppSelector } from "@shared/hooks";
import { ExerciseRow } from "../../../src/components/ExerciseRow";
import { ExerciseHistorySheet } from "../../../components/ExerciseHistorySheet";
import { WorkoutDatePicker } from "../../../components/WorkoutDatePicker";
import { normalizeExerciseKey } from "@shared/core/services/exerciseHistory";
import { useWorkoutEditor } from "../../../hooks/useWorkoutEditor";

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

  const [historySheet, setHistorySheet] = useState<{
    visible: boolean;
    exerciseKey: string;
    exerciseVariant: string;
  }>({ visible: false, exerciseKey: "", exerciseVariant: "" });

  if (!workout) return null;

  function onHistoryPress(key: string) {
    const exercise = exercisesObject[key];
    if (!exercise) return;
    setHistorySheet({
      visible: true,
      exerciseKey: normalizeExerciseKey(exercise.variant),
      exerciseVariant: exercise.variant,
    });
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <WorkoutDatePicker date={workout.date} onDateChange={onDateChange} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {Object.entries(exercisesObject)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([key, exercise]) => (
            <ExerciseRow
              key={key}
              exercise={exercise}
              exerciseKey={key}
              onSetsChange={onSetsChange}
              closeHandler={closeHandler}
              exerciseNameChangeHandler={exerciseNameChangeHandler}
              editMode={true}
              isMobile={true}
              onHistoryPress={onHistoryPress}
            />
          ))}
        <TouchableOpacity onPress={addNewExercise} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <ExerciseHistorySheet
        visible={historySheet.visible}
        onDismiss={() => setHistorySheet((s) => ({ ...s, visible: false }))}
        exerciseKey={historySheet.exerciseKey}
        exerciseVariant={historySheet.exerciseVariant}
        userId={userId}
        sessionSets={[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 40 },
  addButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
});
