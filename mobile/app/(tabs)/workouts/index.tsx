import { useEffect, useState, useCallback } from "react";
import {
  SectionList,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { WorkoutCard } from "../../../src/components/WorkoutCard";
import { useAppTheme, type AppColors } from "../../../hooks/useAppTheme";

type WorkoutSummary = { id: string; date: Timestamp };
type Section = { title: string; data: WorkoutSummary[] };

function groupIntoSections(workouts: WorkoutSummary[]): Section[] {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysFromMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const thisWeek: WorkoutSummary[] = [];
  const lastWeek: WorkoutSummary[] = [];
  const older: WorkoutSummary[] = [];

  for (const w of workouts) {
    const d = w.date?.toDate() ?? new Date(0);
    if (d >= thisMonday) thisWeek.push(w);
    else if (d >= lastMonday) lastWeek.push(w);
    else older.push(w);
  }

  const sections: Section[] = [];
  if (thisWeek.length) sections.push({ title: "This Week", data: thisWeek });
  if (lastWeek.length) sections.push({ title: "Last Week", data: lastWeek });
  if (older.length) sections.push({ title: "Older", data: older });
  return sections;
}

export default function WorkoutsScreen() {
  const userId = useAppSelector((state) => state.auth.userId);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    FirestoreActions.fetchWorkoutSummaries(userId).then(setWorkouts);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []),
  );

  async function createWorkout() {
    const newDoc = FirestoreActions.createWorkout(userId);
    const now = Timestamp.now();
    await FirestoreActions.updateWorkoutById(userId, newDoc.id, {
      date: now,
      exercises: {},
    });
    setWorkouts((ws) => [{ id: newDoc.id, date: now }, ...ws]);
    router.push(`/workouts/${newDoc.id}`);
  }

  function deleteWorkout(id: string) {
    FirestoreActions.deleteWorkoutWithHistory(userId, id);
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
  }

  const sections = groupIntoSections(workouts);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard
            workoutId={item.id}
            refreshKey={refreshKey}
            onDelete={deleteWorkout}
            onPress={() => router.push(`/workouts/${item.id}`)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity onPress={createWorkout} style={styles.fab}>
        <Text style={styles.fabText}>+ Add Workout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 6,
      backgroundColor: c.background,
    },
    sectionHeaderText: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 24,
      backgroundColor: c.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    fabText: { color: c.textInverse, fontWeight: "600" },
  });
}
