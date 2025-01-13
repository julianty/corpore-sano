import { Stack, Text } from "@mantine/core";

export function Hero() {
  return (
    <Stack gap="md">
      <Text fw={700} size="xl">
        Welcome to Corpore Sano!
      </Text>
      <Text size="md">
        This is a demo account. Feel free to explore the app and add your own
        workouts and exercises.
      </Text>
      <Text size="md">
        You can also use the Google Login on the navbar to create your own
        account! This service is still in development, so your data may be lost.
      </Text>
    </Stack>
  );
}
