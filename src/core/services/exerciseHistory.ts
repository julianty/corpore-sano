export interface Lift {
  weight: number;
  reps: number;
  date: string; // ISO date "YYYY-MM-DD"
  workoutId: string; // workout doc the lift was logged in
}

export interface ComputedStats {
  maxWeight: number;
  minWeight: number;
  medianWeight: number;
  setsThisWeek: number;
  setsWeekOf: string; // ISO date of current week's Monday
  bestSetWeight: number; // weight of the highest-volume set ever, in kg
  bestSetReps: number; // reps of the highest-volume set ever
}

export interface ExerciseHistoryDoc {
  exerciseName: string;
  allLifts: Lift[];
  computed: ComputedStats;
}

export function normalizeExerciseKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-z0-9]+$/, "");
}

// Formats a Date as "YYYY-MM-DD" in the **local** timezone. Lift dates and the
// week-Monday bucket must share this basis: using UTC (toISOString) here while
// bucketing locally shifts lifts logged near midnight into the wrong day/week.
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCurrentWeekMonday(): string {
  return getMondayOf(new Date());
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getMondayOf(date: Date): string {
  const dayOfWeek = date.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - daysFromMonday);
  return formatLocalDate(monday);
}

// mondayStr is injectable for testing; defaults to current week's Monday
export function computeStats(lifts: Lift[], mondayStr?: string): ComputedStats {
  const weekMonday = mondayStr ?? getCurrentWeekMonday();
  const weights = lifts.map((l) => l.weight).sort((a, b) => a - b);
  const thisWeekLifts = lifts.filter((l) => l.date >= weekMonday);

  const bestSet = lifts.reduce<Lift | null>(
    (best, l) => (!best || l.weight * l.reps > best.weight * best.reps ? l : best),
    null,
  );

  return {
    maxWeight: weights.length ? weights[weights.length - 1] : 0,
    minWeight: weights.length ? weights[0] : 0,
    medianWeight: weights.length ? median(weights) : 0,
    setsThisWeek: thisWeekLifts.length,
    setsWeekOf: weekMonday,
    bestSetWeight: bestSet?.weight ?? 0,
    bestSetReps: bestSet?.reps ?? 0,
  };
}

// Removes all lifts recorded under the given workout.
export function removeWorkoutLifts(allLifts: Lift[], workoutId: string): Lift[] {
  return allLifts.filter((l) => l.workoutId !== workoutId);
}

// Replaces any stored lifts from this workout with `sessionLifts`,
// preserving lifts from all other workouts (including same-day ones).
export function mergeLifts(
  storedLifts: Lift[],
  sessionLifts: Lift[],
  workoutId: string,
): Lift[] {
  const otherWorkoutLifts = storedLifts.filter((l) => l.workoutId !== workoutId);
  return [...otherWorkoutLifts, ...sessionLifts];
}
