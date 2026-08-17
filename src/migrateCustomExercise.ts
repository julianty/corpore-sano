// Reusable migration: re-point a user's custom exercise onto an existing
// catalog exercise, carrying its logged sets and history across.
//
// What it does for one (user, customExerciseId) → (catalog name, variant):
//   1. Rewrites every workout exercise entry whose `customExerciseId` matches
//      the target: sets `name`/`variant` to the catalog values and drops the
//      `customExerciseId` field. Sets are left untouched.
//   2. Moves/merges the history doc userStats/{uid}/exercises/{oldKey} into
//      {newKey} (lifts + their stored dates carried over losslessly).
//   3. Removes the custom exercise from preferences/userProfile.customExercises.
//
// Matching is by `customExerciseId` ONLY. Workout entries logged before the id
// field existed (variant name matches the custom exercise but no id) are NOT
// rewritten — they are reported as "unmatched candidates" so they can be
// handled by hand.
//
// Usage:
//   npx tsx src/migrateCustomExercise.ts --dry-run \
//     --user <uid> --custom-id <id> --name "<Catalog Name>" --variant "<Variant>"
//   (drop --dry-run to actually write)

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";
import {
  computeStats,
  normalizeExerciseKey,
} from "./core/services/exerciseHistory";
import type { ExerciseHistoryDoc, Lift } from "./core/services/exerciseHistory";
import exerciseCatalogUpdated from "./data/exerciseCatalogUpdated";

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

// ---- arg parsing ------------------------------------------------------------

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const dryRun = process.argv.includes("--dry-run");
const userId = flag("--user");
const customId = flag("--custom-id");
const targetName = flag("--name");
const targetVariant = flag("--variant");

if (!userId || !customId || !targetName || !targetVariant) {
  console.error(
    "Usage: npx tsx src/migrateCustomExercise.ts [--dry-run] " +
      "--user <uid> --custom-id <id> --name <Catalog Name> --variant <Variant>",
  );
  process.exit(1);
}

// ---- catalog validation -----------------------------------------------------

const catalogEntry = exerciseCatalogUpdated.data.find(
  (e) => e.name === targetName,
);
if (!catalogEntry) {
  console.error(
    `Catalog has no exercise named "${targetName}". Add it to ` +
      `src/data/exerciseCatalogUpdated.ts first (Part 1), then re-run.`,
  );
  process.exit(1);
}
if (!(catalogEntry.variants ?? []).includes(targetVariant)) {
  console.warn(
    `⚠ "${targetVariant}" is not a listed variant of "${targetName}". ` +
      `Proceeding anyway — double-check the spelling.`,
  );
}

type ExerciseValue = {
  name?: string;
  variant?: string;
  customExerciseId?: string;
  sets?: { weightkg?: number; reps?: number }[];
};

function isExerciseValue(v: unknown): v is ExerciseValue {
  return !!v && typeof v === "object" && Array.isArray((v as ExerciseValue).sets);
}

async function main() {
  const prefRef = doc(db, "users", userId!, "preferences", "userProfile");
  const prefSnap = await getDoc(prefRef);
  const customExercises =
    (prefSnap.data()?.customExercises as
      | Record<string, { name: string; muscleGroup: string | null }>
      | undefined) ?? {};
  const customEntry: { name: string; muscleGroup: string | null } | undefined =
    customExercises[customId!];

  // The custom exercise's logged variant equals its name (see ExercisePickerModal).
  // Prefer the profile entry; fall back to a matched workout entry below.
  let customName: string | undefined = customEntry?.name;
  if (!customEntry) {
    console.warn(
      `⚠ No customExercises["${customId}"] in preferences — it may have been ` +
        `deleted already. Will infer the old history key from workout entries.`,
    );
  }

  // ---- scan workouts --------------------------------------------------------
  const workoutsSnap = await getDocs(
    collection(db, "users", userId!, "workouts"),
  );

  const rewrites: { workoutId: string; entryKey: string; oldVariant: string }[] =
    [];
  const unmatched: { workoutId: string; entryKey: string; variant: string }[] =
    [];
  // workoutId -> mutated doc data to write back
  const docsToWrite = new Map<string, Record<string, unknown>>();

  for (const wDoc of workoutsSnap.docs) {
    const data = wDoc.data() as Record<string, unknown>;
    const exercises = (data.exercises ?? {}) as Record<string, unknown>;
    let mutated = false;

    for (const [entryKey, value] of Object.entries(exercises)) {
      if (!isExerciseValue(value)) continue;

      if (value.customExerciseId === customId) {
        rewrites.push({
          workoutId: wDoc.id,
          entryKey,
          oldVariant: value.variant ?? value.name ?? "",
        });
        if (!customName) customName = value.name ?? value.variant;
        const next = { ...value, name: targetName!, variant: targetVariant! };
        delete next.customExerciseId;
        exercises[entryKey] = next;
        mutated = true;
      }
    }

    if (mutated) {
      data.exercises = exercises;
      docsToWrite.set(wDoc.id, data);
    }
  }

  if (!customName) {
    console.error(
      "Could not determine the custom exercise name from preferences or " +
        "workouts. Nothing to migrate.",
    );
    process.exit(1);
  }

  // Second pass: report entries that look like this custom exercise by name
  // but carry no / a different customExerciseId (not rewritten).
  const oldKey = normalizeExerciseKey(customName);
  for (const wDoc of workoutsSnap.docs) {
    const data = wDoc.data() as Record<string, unknown>;
    const exercises = (data.exercises ?? {}) as Record<string, unknown>;
    for (const [entryKey, value] of Object.entries(exercises)) {
      if (!isExerciseValue(value)) continue;
      if (value.customExerciseId === customId) continue;
      if (normalizeExerciseKey(value.variant ?? "") === oldKey) {
        unmatched.push({ workoutId: wDoc.id, entryKey, variant: value.variant ?? "" });
      }
    }
  }

  const newKey = normalizeExerciseKey(targetVariant!);

  // ---- report ---------------------------------------------------------------
  console.log(`\n=== migrate custom "${customName}" → ${targetName} / ${targetVariant} ===`);
  console.log(`  user:        ${userId}`);
  console.log(`  customId:    ${customId}`);
  console.log(`  history key: ${oldKey} → ${newKey}`);
  console.log(`  workout entries to rewrite: ${rewrites.length}`);
  for (const r of rewrites) {
    console.log(`    - workout ${r.workoutId} / ${r.entryKey} (was "${r.oldVariant}")`);
  }
  if (unmatched.length > 0) {
    console.log(
      `  ⚠ unmatched candidates (same name, no/other customExerciseId — NOT rewritten): ${unmatched.length}`,
    );
    for (const u of unmatched) {
      console.log(`    - workout ${u.workoutId} / ${u.entryKey} ("${u.variant}")`);
    }
  }

  // ---- history move preview/exec --------------------------------------------
  const [oldHistSnap, newHistSnap] = await Promise.all([
    getDoc(doc(db, "userStats", userId!, "exercises", oldKey)),
    getDoc(doc(db, "userStats", userId!, "exercises", newKey)),
  ]);
  const oldHist = oldHistSnap.exists()
    ? (oldHistSnap.data() as ExerciseHistoryDoc)
    : null;
  const newHist = newHistSnap.exists()
    ? (newHistSnap.data() as ExerciseHistoryDoc)
    : null;
  const oldLifts: Lift[] = oldHist?.allLifts ?? [];
  const existingNewLifts: Lift[] = newKey === oldKey ? [] : newHist?.allLifts ?? [];
  const mergedLifts: Lift[] = [...existingNewLifts, ...oldLifts];

  console.log(
    `  history: ${oldLifts.length} lift(s) from ${oldKey} + ` +
      `${existingNewLifts.length} already under ${newKey} = ${mergedLifts.length} merged`,
  );

  if (dryRun) {
    console.log("\n[dry run] nothing written.");
    process.exit(0);
  }

  // ---- write ----------------------------------------------------------------
  // 1. Workout docs
  for (const [workoutId, data] of docsToWrite) {
    await setDoc(doc(db, "users", userId!, "workouts", workoutId), data);
    console.log(`  wrote workout ${workoutId}`);
  }

  // 2. History: write merged into newKey, delete oldKey
  if (mergedLifts.length > 0) {
    const merged: ExerciseHistoryDoc = {
      exerciseName: targetName!,
      allLifts: mergedLifts,
      computed: computeStats(mergedLifts),
    };
    await setDoc(doc(db, "userStats", userId!, "exercises", newKey), merged);
    console.log(`  wrote history exercises/${newKey} (${mergedLifts.length} lifts)`);
  }
  if (oldKey !== newKey && oldHist) {
    await deleteDoc(doc(db, "userStats", userId!, "exercises", oldKey));
    console.log(`  deleted history exercises/${oldKey}`);
  }

  // 3. Remove the custom exercise from preferences
  if (customExercises[customId!]) {
    const updated = { ...customExercises };
    delete updated[customId!];
    await updateDoc(prefRef, { customExercises: updated });
    console.log(`  removed customExercises["${customId}"] from preferences`);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
