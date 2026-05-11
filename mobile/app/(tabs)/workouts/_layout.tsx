import { Stack } from "expo-router";
import { useAppTheme } from "../../../hooks/useAppTheme";

export default function WorkoutsLayout() {
  const colors = useAppTheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[workoutId]"
        options={{
          title: "Workout",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
}
