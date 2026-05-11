import { useEffect, useState, useMemo, useCallback, useContext } from "react";
import { useFocusEffect } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator as RNActivityIndicator,
} from "react-native";

import { Workout } from "@shared/types";
import { parentGroups } from "@shared/data/muscleGroups";
import { useAppSelector } from "@shared/hooks";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import {
  getByDaysElapsed,
  calculateDaysBetweenDates,
  getLastWorkedText,
} from "@shared/helperFunctions/DateHelper";
import exerciseCatalogUpdated from "@shared/data/exerciseCatalogUpdated";
import { createExerciseMap } from "@shared/utils/exerciseLookup";
import {
  buildMuscleSummary,
  rollupToParentGroups,
  ParentGroupSummary,
} from "@shared/core/services/muscleCalculations";
import { UserProfileContext } from "../../app/_layout";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

const exerciseCatalog = exerciseCatalogUpdated;

export function WeeklySummary() {
  const userId = useAppSelector((state) => state.auth.userId);
  const ctx = useContext(UserProfileContext);
  const customExercises = ctx?.userProfile.customExercises;
  const [workoutArray, setWorkoutArray] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentGroups_, setParentGroups] = useState<ParentGroupSummary>({
    Shoulders: { sets: 0 },
    Back: { sets: 0 },
    Chest: { sets: 0 },
    Arms: { sets: 0 },
    Core: { sets: 0 },
    Legs: { sets: 0 },
  });
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  const exerciseMap = useMemo(
    () => createExerciseMap(exerciseCatalog.data),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const targetDate = getByDaysElapsed(7);
      FirestoreActions.fetchWorkoutsAfterDate(userId, targetDate).then(
        (data) => {
          setWorkoutArray(data.map((w) => w.data));
          setLoading(false);
        },
      );
    }, [userId]),
  );

  useEffect(() => {
    const getDaysSince = (date: Date) =>
      calculateDaysBetweenDates(date, new Date());
    const summary = buildMuscleSummary(workoutArray, exerciseMap, getDaysSince, undefined, customExercises);
    setParentGroups(rollupToParentGroups(summary));
  }, [workoutArray, exerciseMap, customExercises]);

  if (loading)
    return <RNActivityIndicator size="large" style={{ marginTop: 24 }} />;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Muscle Groups This Week</Text>
      </View>
      <ScrollView horizontal>
        <View>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colGroup}>
              <Text style={styles.tableHeaderText}>Group</Text>
            </View>
            <View style={styles.colSets}>
              <Text style={styles.tableHeaderText}>Sets</Text>
            </View>
            <View style={styles.colLast}>
              <Text style={styles.tableHeaderText}>Last Worked</Text>
            </View>
          </View>
          {parentGroups.map((group) => {
            const data = parentGroups_[group];
            const last =
              data.daysSinceLast === undefined || data.daysSinceLast >= 7
                ? "7+ days ago"
                : getLastWorkedText(data.daysSinceLast);
            return (
              <View key={group} style={styles.tableRow}>
                <View style={styles.colGroup}>
                  <Text style={styles.cellText}>{group}</Text>
                </View>
                <View style={styles.colSets}>
                  <Text style={styles.cellText}>{data.sets}</Text>
                </View>
                <View style={styles.colLast}>
                  <Text style={styles.cellText}>{last}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      margin: 16,
      backgroundColor: c.surface,
      borderRadius: 8,
      overflow: "hidden",
    },
    cardHeader: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    cardTitle: { fontSize: 16, fontWeight: "600", color: c.textPrimary },
    tableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    tableHeaderText: { fontWeight: "600", fontSize: 12, color: c.textPrimary },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    cellText: { fontSize: 12, color: c.textPrimary },
    colGroup: { width: 110, paddingVertical: 8, paddingHorizontal: 8, justifyContent: "center" },
    colSets: { width: 110, paddingVertical: 8, paddingHorizontal: 8, justifyContent: "center", alignItems: "flex-end" },
    colLast: { width: 130, paddingVertical: 8, paddingHorizontal: 8, justifyContent: "center" },
  });
}
