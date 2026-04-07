import { useContext } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Text,
  Pressable,
} from "react-native";
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

      <Text style={styles.note}>
        Color scheme follows your device setting ({colorScheme ?? "unknown"})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  buttonGroup: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  buttonActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  buttonText: { color: "#333", fontWeight: "500" },
  buttonTextActive: { color: "#fff" },
  note: { marginTop: 16, opacity: 0.6, fontSize: 12 },
});
