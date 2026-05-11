import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@shared/hooks";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { useAppTheme } from "../../hooks/useAppTheme";

export default function HomeScreen() {
  const displayName = useAppSelector((state) => state.auth.displayName);
  const userId = useAppSelector((state) => state.auth.userId);
  const colors = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        <Text
          style={{ margin: 16, fontSize: 22, fontWeight: "600", color: colors.textPrimary }}
        >
          {userId === "demoUser" ? "Demo Mode" : `Welcome, ${displayName}`}
        </Text>
        <WeeklySummary />
      </ScrollView>
    </SafeAreaView>
  );
}
