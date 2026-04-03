import { Box, Group, Paper, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Workout } from "../../types";

type DotIntensity = "none" | "light" | "full";

function getDotIntensity(exerciseCount: number): DotIntensity {
  if (exerciseCount === 0) return "none";
  if (exerciseCount <= 2) return "light";
  return "full";
}

const dotColors: Record<DotIntensity, string> = {
  none: "var(--mantine-color-dark-4)",
  light: "var(--mantine-color-blue-3)",
  full: "var(--mantine-color-blue-6)",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekDates(mondayDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildWorkoutDateMap(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>();
  workouts.forEach((workout) => {
    if (!workout.date) return;
    const date = workout.date.toDate();
    const key = toDateKey(date);
    const exerciseCount = Object.keys(workout).filter(
      (k) => k !== "date" && typeof workout[k as keyof Workout] === "object",
    ).length;
    map.set(key, (map.get(key) ?? 0) + exerciseCount);
  });
  return map;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function DotRow({
  label,
  dates,
  workoutMap,
  today,
}: {
  label: string;
  dates: Date[];
  workoutMap: Map<string, number>;
  today: Date;
}) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      <Group gap="xs">
        {dates.map((date, i) => {
          const isFuture = date > today;
          const key = toDateKey(date);
          const count = workoutMap.get(key) ?? 0;
          const intensity = isFuture ? "none" : getDotIntensity(count);
          const tooltipLabel = isFuture
            ? `${DAY_LABELS[i]} — ${formatDate(date)}`
            : count > 0
              ? `${DAY_LABELS[i]} — ${formatDate(date)}: ${count} exercises`
              : `${DAY_LABELS[i]} — ${formatDate(date)}: Rest day`;

          return (
            <Tooltip key={i} label={tooltipLabel} withArrow>
              <Stack gap={2} align="center">
                <Text size="xs" c="dimmed">
                  {DAY_LABELS[i]}
                </Text>
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: dotColors[intensity],
                    opacity: isFuture ? 0.3 : 1,
                    border:
                      toDateKey(date) === toDateKey(today)
                        ? "2px solid var(--mantine-color-blue-4)"
                        : "2px solid transparent",
                  }}
                />
              </Stack>
            </Tooltip>
          );
        })}
      </Group>
    </Stack>
  );
}

export function WorkoutActivityTracker({ workouts }: { workouts: Workout[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonday = getMondayOfWeek(today);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const lastWeekDates = getWeekDates(lastMonday);
  const thisWeekDates = getWeekDates(thisMonday);
  const workoutMap = buildWorkoutDateMap(workouts);

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Title order={5}>Activity</Title>
        <DotRow
          label="Last week"
          dates={lastWeekDates}
          workoutMap={workoutMap}
          today={today}
        />
        <DotRow
          label="This week"
          dates={thisWeekDates}
          workoutMap={workoutMap}
          today={today}
        />
      </Stack>
    </Paper>
  );
}
