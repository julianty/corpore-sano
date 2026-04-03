import { useState } from "react";
import {
  Alert,
  Badge,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconClock,
  IconInfoCircle,
} from "@tabler/icons-react";

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Group gap="sm" wrap="nowrap">
      {icon}
      <Text size="sm">{text}</Text>
    </Group>
  );
}

const currentFeatures = [
  "Logging workouts automatically updates your analysis",
  "View your recent workouts at a glance",
];

const plannedFeatures = [
  "Calculate your MEV and MRV for each muscle group",
  "Export workout data to CSV",
  "Printable workout plans",
  "Workout mode for streamlined logging",
];

export function Hero() {
  const [showBanner, setShowBanner] = useState(true);
  const [showHero, setShowHero] = useState(true);

  return (
    <Stack gap="md">
      {showBanner && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Demo Account"
          color="blue"
          variant="light"
          withCloseButton
          onClose={() => setShowBanner(false)}
        >
          This is a demo account. Feel free to explore, or use Google Login to
          create your own account.
        </Alert>
      )}

      {showHero && (
      <Paper p="md" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Title order={2}>Corpore Sano</Title>
              <Text size="lg" c="dimmed">
                Your intelligent workout tracker
              </Text>
            </Stack>
            <CloseButton
              aria-label="Hide hero section"
              onClick={() => setShowHero(false)}
            />
          </Group>

          <Stack gap="sm">
            <Title order={4}>Key Features</Title>
            <Stack gap="xs" p={"md"}>
              {currentFeatures.map((feature) => (
                <FeatureItem
                  key={feature}
                  icon={
                    <ThemeIcon color="teal" variant="light" size="md">
                      <IconCircleCheck size={16} />
                    </ThemeIcon>
                  }
                  text={feature}
                />
              ))}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Group gap="sm">
              <Title order={4}>Planned Features</Title>
              <Badge variant="light" color="orange">
                Coming Soon
              </Badge>
            </Group>
            <Stack gap="xs" p={"md"}>
              {plannedFeatures.map((feature) => (
                <FeatureItem
                  key={feature}
                  icon={
                    <ThemeIcon color="orange" variant="light" size="md">
                      <IconClock size={16} />
                    </ThemeIcon>
                  }
                  text={feature}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      )}
    </Stack>
  );
}
