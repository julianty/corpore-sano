import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPreferences } from "../../src/components/UserPreferences";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView>
        <Text style={{ margin: 16, fontSize: 22, fontWeight: "600", color: "#000" }}>
          Settings
        </Text>
        <UserPreferences />
      </ScrollView>
    </SafeAreaView>
  );
}
