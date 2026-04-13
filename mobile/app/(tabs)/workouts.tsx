import { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Timestamp } from "firebase/firestore";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { Workout } from "@shared/types";
import { WorkoutCard } from "../../src/components/WorkoutCard";

export default function WorkoutsScreen() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workoutIds, setWorkoutIds] = useState<string[]>([]);

  useEffect(() => {
    FirestoreActions.fetchWorkoutIds(userId).then(setWorkoutIds);
  }, [userId]);

  async function addWorkout() {
    const newDoc = FirestoreActions.createWorkout(userId);
    await FirestoreActions.updateWorkoutById(userId, newDoc.id, {
      date: Timestamp.now(),
    } as Workout);
    setWorkoutIds((ids) => [...ids, newDoc.id]);
  }

  function deleteWorkout(id: string) {
    FirestoreActions.deleteWorkoutById(userId, id);
    setWorkoutIds((ids) => ids.filter((wid) => wid !== id));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={workoutIds}
        keyExtractor={(id) => id}
        renderItem={({ item }) => (
          <WorkoutCard workoutId={item} onDelete={deleteWorkout} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity
        onPress={addWorkout}
        style={{
          position: "absolute",
          right: 16,
          bottom: 24,
          backgroundColor: "#007AFF",
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ Add Workout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
