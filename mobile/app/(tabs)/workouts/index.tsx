import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { Workout } from "@shared/types";
import { WorkoutCard } from "../../../src/components/WorkoutCard";

export default function WorkoutsScreen() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workoutIds, setWorkoutIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    FirestoreActions.fetchWorkoutIds(userId).then(setWorkoutIds);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []),
  );

  async function createWorkout() {
    const newDoc = FirestoreActions.createWorkout(userId);
    await FirestoreActions.updateWorkoutById(userId, newDoc.id, {
      date: Timestamp.now(),
    } as Workout);
    setWorkoutIds((ids) => [newDoc.id, ...ids]);
    router.push(`/workouts/${newDoc.id}`);
  }

  function deleteWorkout(id: string) {
    FirestoreActions.deleteWorkoutWithHistory(userId, id);
    setWorkoutIds((ids) => ids.filter((wid) => wid !== id));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={workoutIds}
        keyExtractor={(id) => id}
        renderItem={({ item }) => (
          <WorkoutCard
            workoutId={item}
            refreshKey={refreshKey}
            onDelete={deleteWorkout}
            onPress={() => router.push(`/workouts/${item}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity onPress={createWorkout} style={styles.fab}>
        <Text style={styles.fabText}>+ Add Workout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  fabText: { color: "#fff", fontWeight: "600" },
});
