import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  View,
  Pressable,
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
  const [menuVisible, setMenuVisible] = useState(false);
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

  async function createWorkout(destination: "detail" | "workout-mode") {
    setMenuVisible(false);
    const newDoc = FirestoreActions.createWorkout(userId);
    await FirestoreActions.updateWorkoutById(userId, newDoc.id, {
      date: Timestamp.now(),
    } as Workout);
    setWorkoutIds((ids) => [...ids, newDoc.id]);
    if (destination === "detail") {
      router.push(`/workouts/${newDoc.id}`);
    } else {
      router.push(`/workout-mode/${newDoc.id}`);
    }
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
          <WorkoutCard
            workoutId={item}
            refreshKey={refreshKey}
            onDelete={deleteWorkout}
            onPress={() => router.push(`/workouts/${item}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.fab}>
        <Text style={styles.fabText}>+ Add Workout</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => createWorkout("detail")}
            >
              <Text style={styles.menuItemText}>New Workout</Text>
              <Text style={styles.menuItemSub}>Add and edit a workout log</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => createWorkout("workout-mode")}
            >
              <Text style={styles.menuItemText}>Start Workout Mode</Text>
              <Text style={styles.menuItemSub}>Live entry with timers</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: { padding: 16 },
  menuItemText: { fontSize: 16, fontWeight: "600", color: "#111" },
  menuItemSub: { fontSize: 13, color: "#888", marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: "#eee" },
});
