// One-off migration: rebuild every userStats/{userId}/exercises/{key} doc from
// the workouts collection (the source of truth), tagging each lift with the
// workoutId it came from. History docs with no surviving workout source are
// deleted. Repairs any drift caused by the pre-workoutId merge/removal bugs.
//
// Usage:
//   npx tsx src/migrateLiftWorkoutIds.ts --dry-run [userId ...]
//   npx tsx src/migrateLiftWorkoutIds.ts [userId ...]
//
// Users are discovered from the `users` and `userStats` collections; pass
// explicit user IDs as args to cover parents that exist only as subcollections
// (those are invisible to getDocs on the parent collection).

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";
import {
  computeStats,
  formatLocalDate,
  normalizeExerciseKey,
} from "./core/services/exerciseHistory";
import type { ExerciseHistoryDoc, Lift } from "./core/services/exerciseHistory";

dotenv.config();

const env = process.env;
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY ?? env.VITE_firebase_apiKey,
  authDomain: env.FIREBASE_AUTH_DOMAIN ?? env.VITE_firebase_authDomain,
  projectId: env.FIREBASE_PROJECT_ID ?? env.VITE_firebase_projectId,
  storageBucket: env.FIREBASE_STORAGE_BUCKET ?? env.VITE_firebase_storageBucket,
  messagingSenderId:
    env.FIREBASE_MESSAGING_SENDER_ID ?? env.VITE_firebase_messagingSenderId,
  appId: env.FIREBASE_APP_ID ?? env.VITE_firebase_appId,
};

if (!firebaseConfig.projectId) {
  console.error("Missing FIREBASE_* env vars (see .env / src/migrate.ts).");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cliUserIds = args.filter((a) => a !== "--dry-run");

function workoutDateStr(date: unknown): string {
  if (date instanceof Timestamp) {
    return formatLocalDate(date.toDate());
  }
  // Matches updateWorkoutById's default for date-less workouts
  return formatLocalDate(new Date());
}

async function discoverUserIds(): Promise<string[]> {
  const ids = new Set<string>(cliUserIds);
  for (const coll of ["users", "userStats"]) {
    const snapshot = await getDocs(collection(db, coll));
    snapshot.docs.forEach((d) => ids.add(d.id));
  }
  return [...ids];
}

async function rebuildUser(userId: string): Promise<void> {
  console.log(`\n=== ${userId} ===`);

  const workoutsSnap = await getDocs(
    collection(db, "users", userId, "workouts"),
  );
  console.log(`  workouts: ${workoutsSnap.docs.length}`);

  // key → rebuilt doc contents
  const rebuilt = new Map<string, { exerciseName: string; allLifts: Lift[] }>();

  for (const workoutDoc of workoutsSnap.docs) {
    const workoutId = workoutDoc.id;
    const data = workoutDoc.data();
    const date = workoutDateStr(data.date);

    const exercises = (data.exercises ?? {}) as Record<string, unknown>;
    for (const value of Object.values(exercises)) {
      if (!value || typeof value !== "object") continue;
      const exercise = value as {
        name?: string;
        variant?: string;
        sets?: { weightkg?: number; reps?: number }[];
      };
      if (!Array.isArray(exercise.sets)) continue;

      const firestoreKey = normalizeExerciseKey(exercise.variant ?? "");
      if (!firestoreKey) continue;

      const lifts: Lift[] = exercise.sets
        .filter((s) => (s.weightkg ?? 0) > 0 && (s.reps ?? 0) > 0)
        .map((s) => ({
          weight: s.weightkg!,
          reps: s.reps!,
          date,
          workoutId,
        }));
      if (lifts.length === 0) continue;

      const entry = rebuilt.get(firestoreKey) ?? {
        exerciseName: exercise.name || exercise.variant || firestoreKey,
        allLifts: [],
      };
      entry.allLifts.push(...lifts);
      rebuilt.set(firestoreKey, entry);
    }
  }

  for (const [firestoreKey, { exerciseName, allLifts }] of rebuilt) {
    const historyDoc: ExerciseHistoryDoc = {
      exerciseName,
      allLifts,
      computed: computeStats(allLifts),
    };
    console.log(
      `  ${dryRun ? "[dry-run] would write" : "write"} exercises/${firestoreKey}: ${allLifts.length} lifts`,
    );
    if (!dryRun) {
      await setDoc(
        doc(db, "userStats", userId, "exercises", firestoreKey),
        historyDoc,
      );
    }
  }

  // Delete history docs that no workout supports anymore
  const existingSnap = await getDocs(
    collection(db, "userStats", userId, "exercises"),
  );
  for (const existing of existingSnap.docs) {
    if (rebuilt.has(existing.id)) continue;
    console.log(
      `  ${dryRun ? "[dry-run] would delete" : "delete"} exercises/${existing.id} (no workout source)`,
    );
    if (!dryRun) {
      await deleteDoc(doc(db, "userStats", userId, "exercises", existing.id));
    }
  }
}

async function main() {
  const userIds = await discoverUserIds();
  console.log(
    `Discovered ${userIds.length} user(s): ${userIds.join(", ") || "(none)"}`,
  );
  if (userIds.length === 0) {
    console.log(
      "No users found — parent docs may not exist; pass user IDs as CLI args.",
    );
  }
  for (const userId of userIds) {
    await rebuildUser(userId);
  }
  console.log(`\nDone${dryRun ? " (dry run — nothing written)" : ""}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
