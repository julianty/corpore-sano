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
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  // Use local date parts to avoid UTC-offset shifting the date string
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// mondayStr is injectable for testing; defaults to current week's Monday
export function computeStats(lifts: Lift[], mondayStr?: string): ComputedStats {
  const weekMonday = mondayStr ?? getCurrentWeekMonday();
  const weights = lifts.map((l) => l.weight).sort((a, b) => a - b);
  const setsThisWeek = lifts.filter((l) => l.date >= weekMonday).length;

  return {
    maxWeight: weights.length ? weights[weights.length - 1] : 0,
    minWeight: weights.length ? weights[0] : 0,
    medianWeight: weights.length ? median(weights) : 0,
    setsThisWeek,
    setsWeekOf: weekMonday,
  };
}

// Removes lifts matching the given set signatures using one-to-one consumption,
// so duplicate weights/reps only remove the exact count present in `sets`.
export function removeMatchingLifts(
  allLifts: Lift[],
  sets: { weight: number; reps: number }[],
): Lift[] {
  const pool = [...sets];
  return allLifts.filter((lift) => {
    const idx = pool.findIndex((s) => s.weight === lift.weight && s.reps === lift.reps);
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
