import { useContext } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Text, SegmentedButtons } from "react-native-paper";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { UserProfileContext } from "../../app/_layout";

export function UserPreferences() {
  const ctx = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);
  const colorScheme = useColorScheme();

  if (!ctx) return null;
  const { userProfile, setUserProfile } = ctx;

  function updateWeightUnit(unit: "lbs" | "kg") {
    const updated = { ...userProfile, weightUnit: unit };
    setUserProfile(updated);
    FirestoreActions.updateUserProfile(userId, updated);
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.label}>
        Weight Unit
      </Text>
      <SegmentedButtons
        value={userProfile.weightUnit}
        onValueChange={(v) => updateWeightUnit(v as "lbs" | "kg")}
        buttons={[
          { value: "lbs", label: "lbs" },
          { value: "kg", label: "kg" },
        ]}
      />

      <Text variant="bodySmall" style={styles.note}>
        Color scheme follows your device setting ({colorScheme ?? "unknown"})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { marginBottom: 4 },
  note: { marginTop: 16, opacity: 0.6 },
});
