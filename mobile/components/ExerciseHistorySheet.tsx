import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { computeStats } from "@shared/core/services/exerciseHistory";
import type {
  ComputedStats,
  Lift,
} from "@shared/core/services/exerciseHistory";
import type { SetEntry } from "@shared/types";
import { kgToLbs } from "@shared/lib/utils";
import { UserProfileContext } from "../app/_layout";
import { useAppTheme, type AppColors } from "../hooks/useAppTheme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  exerciseKey: string;
  exerciseVariant: string;
  userId: string;
  sessionSets: SetEntry[];
}

export function ExerciseHistorySheet({
  visible,
  onDismiss,
  exerciseKey,
  exerciseVariant,
  userId,
  sessionSets,
}: Props) {
  const ctx = useContext(UserProfileContext);
  const weightUnit = ctx?.userProfile.weightUnit ?? "lbs";
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const storedLiftsRef = useRef<Lift[]>([]);

  useEffect(() => {
    if (!visible) return;
    setFetchLoading(true);
    storedLiftsRef.current = [];

    FirestoreActions.fetchExerciseHistory(userId, exerciseKey)
      .then((doc) => {
        storedLiftsRef.current = doc?.allLifts ?? [];
      })
      .finally(() => setFetchLoading(false));
  }, [visible, exerciseKey, userId]);

  useEffect(() => {
    if (!visible || fetchLoading) return;

    setHasHistory(storedLiftsRef.current.length > 0);
    setStats(computeStats(storedLiftsRef.current));
  }, [visible, fetchLoading, sessionSets]);

  function fmt(kg: number): string {
    const val = weightUnit === "lbs" ? kgToLbs(kg) : kg;
    return `${Math.round(val * 10) / 10} ${weightUnit}`;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{exerciseVariant}</Text>

          {fetchLoading ? (
            <ActivityIndicator style={styles.spinner} />
          ) : !hasHistory ? (
            <Text style={styles.empty}>
              No exercise history for {exerciseVariant}
            </Text>
          ) : stats ? (
            <View style={styles.grid}>
              <StatRow label="All-time max" value={fmt(stats.maxWeight)} colors={colors} />
              <StatRow label="Median weight" value={fmt(stats.medianWeight)} colors={colors} />
              <StatRow label="Min weight" value={fmt(stats.minWeight)} colors={colors} />
              <StatRow label="Sets this week" value={String(stats.setsThisWeek)} colors={colors} />
              {stats.bestSetReps > 0 && (
                <StatRow
                  label="Max volume"
                  value={`${stats.bestSetReps} × ${fmt(stats.bestSetWeight)}`}
                  colors={colors}
                />
              )}
            </View>
          ) : null}

          <Pressable onPress={onDismiss} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatRow({ label, value, colors }: { label: string; value: string; colors: AppColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 24,
      paddingBottom: 40,
      gap: 16,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: c.handle,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: c.textPrimary,
    },
    spinner: { marginVertical: 24 },
    empty: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
      marginVertical: 24,
    },
    grid: { gap: 12 },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      paddingBottom: 8,
    },
    statLabel: { fontSize: 14, color: c.textSecondary },
    statValue: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
    closeBtn: {
      marginTop: 8,
      paddingVertical: 12,
      backgroundColor: c.surfaceVariant,
      borderRadius: 8,
      alignItems: "center",
    },
    closeBtnText: { fontSize: 15, fontWeight: "600", color: c.textPrimary },
  });
}
