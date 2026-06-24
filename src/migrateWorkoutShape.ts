// One-off migration: move workout exercise entries from the top level of each
// workout doc into a nested `exercises` sub-map.
//
//   before:  { date, durationSeconds?, <uuid>: Exercise, <uuid>: Exercise }
//   after:   { date, durationSeconds?, exercises: { <uuid>: Exercise, ... } }
//
// Must be run BEFORE deploying the code that reads `workout.exercises` (hard
// cutover — the new code does not fall back to the old top-level shape).
//
// Idempotent: docs already in the nested shape are left untouched; if a doc has
// both a partial `exercises` map and stray top-level entries, they are merged.
//
// Usage:
//   npx tsx src/migrateWorkoutShape.ts --dry-run [userId ...]
//   npx tsx src/migrateWorkoutShape.ts [userId ...]
//
// Users are discovered from the `users` and `userStats` collections; pass
// explicit user IDs as args to cover parents that exist only as subcollections.

import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";

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

// Scalar/reserved top-level fields that are NOT exercise entries.
const RESERVED = new Set(["date", "durationSeconds", "exercises"]);

function isExerciseEntry(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as { sets?: unknown }).sets)
  );
}

async function discoverUserIds(): Promise<string[]> {
  const ids = new Set<string>(cliUserIds);
  for (const coll of ["users", "userStats"]) {
    const snapshot = await getDocs(collection(db, coll));
    snapshot.docs.forEach((d) => ids.add(d.id));
  }
  return [...ids];
}

async function migrateUser(userId: string): Promise<void> {
  console.log(`\n=== ${userId} ===`);

  const workoutsSnap = await getDocs(
    collection(db, "users", userId, "workouts"),
  );
  console.log(`  workouts: ${workoutsSnap.docs.length}`);

  for (const workoutDoc of workoutsSnap.docs) {
    const data = workoutDoc.data() as Record<string, unknown>;

    const existingExercises =
      (data.exercises as Record<string, unknown> | undefined) ?? {};
    const exercises: Record<string, unknown> = { ...existingExercises };

    // Collect stray top-level entries (and warn on anything unexpected).
    const movedKeys: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (RESERVED.has(key)) continue;
      if (isExerciseEntry(value)) {
        exercises[key] = value;
        movedKeys.push(key);
      } else {
        console.warn(
          `  ⚠ ${workoutDoc.id}: unexpected top-level field "${key}" ` +
            `(not an exercise) — leaving it out of exercises.`,
        );
      }
    }

    if (movedKeys.length === 0) {
      // Already nested (or empty) — nothing to do.
      continue;
    }

    // Full-replace doc: keep date/durationSeconds, nest exercises, drop the
    // old top-level entry keys.
    const rebuilt: Record<string, unknown> = { exercises };
    if ("date" in data) rebuilt.date = data.date;
    if ("durationSeconds" in data) rebuilt.durationSeconds = data.durationSeconds;

    console.log(
      `  ${dryRun ? "[dry-run] would migrate" : "migrating"} ${workoutDoc.id}: ` +
        `${movedKeys.length} entr${movedKeys.length === 1 ? "y" : "ies"} → exercises`,
    );

    if (!dryRun) {
      await setDoc(
        doc(db, "users", userId, "workouts", workoutDoc.id),
        rebuilt,
      );
    }
  }
}

async function main() {
  const userIds = await discoverUserIds();
  console.log(
    `${dryRun ? "DRY RUN — " : ""}migrating workout shape for ${userIds.length} user(s)`,
  );
  for (const userId of userIds) {
    await migrateUser(userId);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
