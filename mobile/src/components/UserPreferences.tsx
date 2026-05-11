import { useContext } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { UserProfileContext } from "../../app/_layout";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";
import type { UserProfile } from "@shared/types";

type ColorSchemeOption = UserProfile["colorScheme"];

const COLOR_SCHEME_OPTIONS: { value: ColorSchemeOption; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function UserPreferences() {
  const ctx = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);
  const colors = useAppTheme();
  const styles = makeStyles(colors);

  if (!ctx) return null;
  const { userProfile, setUserProfile } = ctx;

  function updateWeightUnit(unit: "lbs" | "kg") {
    const updated = { ...userProfile, weightUnit: unit };
    setUserProfile(updated);
    FirestoreActions.updateUserProfile(userId, updated);
  }

  function updateColorScheme(scheme: ColorSchemeOption) {
    const updated = { ...userProfile, colorScheme: scheme };
    setUserProfile(updated);
    FirestoreActions.updateUserProfile(userId, updated);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Weight Unit</Text>
      <View style={styles.buttonGroup}>
        <Pressable
          onPress={() => updateWeightUnit("lbs")}
          style={[
            styles.button,
            userProfile.weightUnit === "lbs" && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              userProfile.weightUnit === "lbs" && styles.buttonTextActive,
            ]}
          >
            lbs
          </Text>
        </Pressable>
        <Pressable
          onPress={() => updateWeightUnit("kg")}
          style={[
            styles.button,
            userProfile.weightUnit === "kg" && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              userProfile.weightUnit === "kg" && styles.buttonTextActive,
            ]}
          >
            kg
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Color Scheme</Text>
      <View style={styles.buttonGroup}>
        {COLOR_SCHEME_OPTIONS.map(({ value, label }) => (
          <Pressable
            key={value}
            onPress={() => updateColorScheme(value)}
            style={[
              styles.button,
              userProfile.colorScheme === value && styles.buttonActive,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                userProfile.colorScheme === value && styles.buttonTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: 16, gap: 12 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: c.textPrimary },
    buttonGroup: { flexDirection: "row", gap: 8 },
    button: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.borderInput,
      alignItems: "center",
    },
    buttonActive: { backgroundColor: c.accent, borderColor: c.accent },
    buttonText: { color: c.textPrimary, fontWeight: "500" },
    buttonTextActive: { color: c.textInverse },
  });
}
