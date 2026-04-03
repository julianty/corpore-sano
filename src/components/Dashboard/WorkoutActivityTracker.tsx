import { Box, Group, Paper, Stack, Text, Title, Tooltip } from "@mantine/core";
import { WorkoutEntry } from "../../types";

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

interface DateInfo {
  exerciseCount: number;
  workoutIds: string[];
}

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

function buildWorkoutDateMap(
  workoutEntries: WorkoutEntry[],
): Map<string, DateInfo> {
  const map = new Map<string, DateInfo>();
  workoutEntries.forEach((entry) => {
    if (!entry.data.date) return;
    const date = entry.data.date.toDate();
    const key = toDateKey(date);
    const exerciseCount = Object.keys(entry.data).filter(
      (k) =>
        k !== "date" &&
        typeof (entry.data as unknown as Record<string, unknown>)[k] ===
          "object",
    ).length;
    const existing = map.get(key);
    if (existing) {
      existing.exerciseCount += exerciseCount;
      existing.workoutIds.push(entry.id);
    } else {
      map.set(key, { exerciseCount, workoutIds: [entry.id] });
    }
  });
  return map;
}

function scrollToWorkout(workoutIds: string[]) {
  if (workoutIds.length === 0) return;
  const el = document.getElementById(`workout-${workoutIds[0]}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("workout-highlight");
  void el.offsetWidth; // force reflow so re-adding the class restarts the animation
  el.classList.add("workout-highlight");
  setTimeout(() => el.classList.remove("workout-highlight"), 1500);
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
  workoutMap: Map<string, DateInfo>;
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
          const info = workoutMap.get(key);
          const count = info?.exerciseCount ?? 0;
          const intensity = isFuture ? "none" : getDotIntensity(count);
          const hasWorkout = !isFuture && count > 0;
          const tooltipLabel = isFuture
            ? `${DAY_LABELS[i]} — ${formatDate(date)}`
            : count > 0
              ? `${DAY_LABELS[i]} — ${formatDate(date)}: ${count} exercises`
              : `${DAY_LABELS[i]} — ${formatDate(date)}`;

          return (
            <Tooltip key={i} label={tooltipLabel} withArrow>
              <Stack
                gap={2}
                align="center"
                style={{ cursor: hasWorkout ? "pointer" : "default" }}
                onClick={
                  hasWorkout
                    ? () => scrollToWorkout(info!.workoutIds)
                    : undefined
                }
              >
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

export function WorkoutActivityTracker({
  workoutEntries,
}: {
  workoutEntries: WorkoutEntry[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonday = getMondayOfWeek(today);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const lastWeekDates = getWeekDates(lastMonday);
  const thisWeekDates = getWeekDates(thisMonday);
  const workoutMap = buildWorkoutDateMap(workoutEntries);

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
