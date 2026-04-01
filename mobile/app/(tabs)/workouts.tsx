import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { FAB } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { WorkoutCard } from "../../src/components/WorkoutCard";

export default function WorkoutsScreen() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workoutIds, setWorkoutIds] = useState<string[]>([]);

  useEffect(() => {
    FirestoreActions.fetchWorkoutIds(userId).then(setWorkoutIds);
  }, [userId]);

  function addWorkout() {
    const newDoc = FirestoreActions.createWorkout(userId);
    setWorkoutIds((ids) => [...ids, newDoc.id]);
  }

  function deleteWorkout(id: string) {
    FirestoreActions.deleteWorkoutById(userId, id);
    setWorkoutIds((ids) => ids.filter((wid) => wid !== id));
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={workoutIds}
        keyExtractor={(id) => id}
        renderItem={({ item }) => (
          <WorkoutCard workoutId={item} onDelete={deleteWorkout} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <FAB
        icon="plus"
        style={{ position: "absolute", right: 16, bottom: 24 }}
        onPress={addWorkout}
        label="Add Workout"
      />
    </SafeAreaView>
  );
}
