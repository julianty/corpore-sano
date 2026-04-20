import { useEffect, useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  ScrollView,
  View,
  Text,
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

const exerciseCatalog = exerciseCatalogUpdated;

export function WeeklySummary() {
  const userId = useAppSelector((state) => state.auth.userId);
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
    const summary = buildMuscleSummary(workoutArray, exerciseMap, getDaysSince);
    setParentGroups(rollupToParentGroups(summary));
  }, [workoutArray, exerciseMap]);

  if (loading)
    return <RNActivityIndicator size="large" style={{ marginTop: 24 }} />;

  return (
    <View
      style={{
        margin: 16,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#ddd",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Muscle Groups This Week
        </Text>
      </View>
      <ScrollView horizontal>
        <View>
          {/* Header row */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          >
            <View
              style={{
                width: 110,
                paddingVertical: 8,
                paddingHorizontal: 8,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 12 }}>Group</Text>
            </View>
            <View
              style={{
                width: 110,
                paddingVertical: 8,
                paddingHorizontal: 8,
                justifyContent: "center",
                alignItems: "flex-end",
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 12 }}>Sets</Text>
            </View>
            <View
              style={{
                width: 130,
                paddingVertical: 8,
                paddingHorizontal: 8,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 12 }}>
                Last Worked
              </Text>
            </View>
          </View>
          {/* Data rows */}
          {parentGroups.map((group) => {
            const data = parentGroups_[group];
            const last =
              data.daysSinceLast === undefined || data.daysSinceLast >= 7
                ? "7+ days ago"
                : getLastWorkedText(data.daysSinceLast);
            return (
              <View
                key={group}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <View
                  style={{
                    width: 110,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{group}</Text>
                </View>
                <View
                  style={{
                    width: 110,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                    alignItems: "flex-end",
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{data.sets}</Text>
                </View>
                <View
                  style={{
                    width: 130,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 11 }}>{last}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
