import { ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@shared/hooks";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { GoogleSignIn } from "../../src/components/GoogleSignIn";

export default function DashboardScreen() {
  const displayName = useAppSelector((state) => state.auth.displayName);
  const userId = useAppSelector((state) => state.auth.userId);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <Text variant="headlineMedium" style={{ margin: 16 }}>
          {userId === "demoUser" ? "Demo Mode" : `Welcome, ${displayName}`}
        </Text>
        <GoogleSignIn />
        <WeeklySummary />
      </ScrollView>
    </SafeAreaView>
  );
}
