export interface Lift {
  weight: number;
  reps: number;
  date: string; // ISO date "YYYY-MM-DD"
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
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

// Removes lifts matching the given set signatures using one-to-one consumption,
// so duplicate weights/reps only remove the exact count present in `sets`.
// When a set carries a `date`, it must also match the lift's date — this prevents
// removing a same-weight/reps lift logged on a different day. Sets without a date
// fall back to matching on weight+reps only.
export function removeMatchingLifts(
  allLifts: Lift[],
  sets: { weight: number; reps: number; date?: string }[],
): Lift[] {
  const pool = [...sets];
  return allLifts.filter((lift) => {
    const idx = pool.findIndex(
      (s) =>
        s.weight === lift.weight &&
        s.reps === lift.reps &&
        (s.date === undefined || s.date === lift.date),
    );
    if (idx !== -1) {
      pool.splice(idx, 1);
      return false;
    }
    return true;
  });
}

// Replaces any stored lifts from `today` with `sessionLifts`, preserving all other dates.
export function mergeLifts(
  storedLifts: Lift[],
  sessionLifts: Lift[],
  today: string,
): Lift[] {
  const priorLifts = storedLifts.filter((l) => l.date !== today);
  return [...priorLifts, ...sessionLifts];
}
