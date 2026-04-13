import { useContext } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPreferences } from "../../src/components/UserPreferences";
import { UserProfileContext } from "../_layout";
import { useAppSelector } from "@shared/hooks";

export default function SettingsScreen() {
  const ctx = useContext(UserProfileContext);
  const displayName = useAppSelector((state) => state.auth.displayName);
  const userId = useAppSelector((state) => state.auth.userId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.accountLabel}>
          {userId === "demoUser" ? "Demo Mode" : displayName}
        </Text>
        <UserPreferences />
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => ctx?.handleSignOut()}
          >
            <Text style={styles.signOutText}>
              {userId === "demoUser" ? "Back to Login" : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: { margin: 16, fontSize: 22, fontWeight: "600", color: "#000" },
  accountLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    color: "#666",
  },
  signOutContainer: { padding: 16, marginTop: 8 },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cc3300",
    alignItems: "center",
  },
  signOutText: { color: "#cc3300", fontSize: 15, fontWeight: "500" },
});
