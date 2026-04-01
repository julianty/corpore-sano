import { ScrollView } from "react-native";
import { Text, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPreferences } from "../../src/components/UserPreferences";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";
import { useAppSelector } from "@shared/hooks";

export default function SettingsScreen() {
  const displayName = useAppSelector((state) => state.auth.displayName);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <Text variant="headlineMedium" style={{ margin: 16 }}>
          Settings
        </Text>
        <Text
          variant="bodyMedium"
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          Signed in as {displayName}
        </Text>
        <Divider />
        <UserPreferences />
        <Divider />
        <Text variant="labelLarge" style={{ margin: 16 }}>
          Account
        </Text>
        <GoogleSignIn />
      </ScrollView>
    </SafeAreaView>
  );
}
