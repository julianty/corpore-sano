# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Web app (root)

```bash
npm run dev        # Vite dev server
npm run build      # tsc + vite build
npm run lint       # ESLint (zero warnings allowed)
npm test           # Jest (all tests)
npx jest path/to/file.test.ts  # Single test file
```

### Mobile app (`mobile/`)

```bash
cd mobile
npm run start      # Expo dev server (Expo Go)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

No test suite exists for the mobile app yet.

## Architecture

Monorepo with two apps sharing business logic. The web app's `src/` doubles as the shared library — no separate `packages/shared` workspace.

### Code sharing via `@shared`

Mobile imports web source with `import { X } from "@shared/types"`. Wired at three levels: TypeScript `paths` in `mobile/tsconfig.json`, `babel-plugin-module-resolver` in `mobile/babel.config.js`, and `watchFolders`/`nodeModulesPaths` in `mobile/metro.config.js`.

Firebase init uses Metro's `.native.ts` extension: `src/initializeFirebase.native.ts` is auto-preferred over `src/initializeFirebase.tsx` in the RN build.

### Shared vs. platform-specific

| Shared (`src/`, via `@shared`)       | Web-only                      | Mobile-only (`mobile/`)       |
| ------------------------------------ | ----------------------------- | ----------------------------- |
| Redux store, slices, typed hooks     | Mantine components            | Expo Router layouts/screens   |
| Domain types (`types.ts`)            | SVG muscle diagram            | React Native Paper components |
| `FirestoreActions` CRUD              | Design tokens / Mantine theme | Bottom tab navigation         |
| Muscle calculation services          |                               | `.native.ts` Firebase init    |
| Exercise catalog + muscle group data |                               |                               |
| Date helpers, unit conversion        |                               |                               |

### Domain types (`src/types.ts`)

Core types: `Exercise`, `SetEntry`, `Workout`, `ExerciseMap`, `Muscle`, `MuscleSummary`, `UserProfile`.

`Workout.exercises` is an `ExerciseMap` (object keyed by UUID). Each `Exercise` holds a `SetEntry[]` with both `weightlbs` and `weightkg` stored.

### Firestore data model

```
users/{userId}/
  workouts/{workoutId}          # Workout docs (date, exercises, durationSeconds)
  preferences/userProfile       # UserProfile (weightUnit, colorScheme, customExercises, favoriteExercises)

userStats/{userId}/
  exercises/{exerciseKey}       # Per-exercise history
```

All `FirestoreActions` live in `src/helperFunctions/FirestoreActions.tsx`. Reads use server-side `where`/`orderBy` push-down; never filter client-side.

### Business logic (`src/core/`)

- `buildMuscleSummary(workouts, exerciseMap)` — per-muscle set counts and recency data
- `rollupToParentGroups(muscleSummary)` — aggregates muscles into parent groups (Shoulders, Back, Chest, Arms, Core, Legs)

### Redux

Two slices in `src/features/`: `auth` (userId, displayName) and `exercises` (exercise catalog). User profile state lives in React context (`UserProfileContext` in `mobile/app/_layout.tsx`), not Redux.

## Testing

Jest with ts-jest. Firebase and Mantine ESM modules are stubbed in `__mocks__/`. Tests live alongside source: `src/core/services/muscleCalculations.test.ts`, `src/lib/utils.test.ts`.

## Mobile routing

```
mobile/app/
  _layout.tsx              # Root: Redux Provider + auth gate + UserProfileContext
  (tabs)/
    _layout.tsx            # Bottom tab navigator
    index.tsx              # Dashboard
    workouts/
      index.tsx            # Workout list (paginated, date desc)
      [workoutId].tsx      # Workout detail — exercise summary cards + ExerciseEditDrawer
```

Key mobile-only components:

- `mobile/components/ExerciseEditDrawer.tsx` — bottom sheet for set editing; auto-fetches and displays exercise history stats (max, median, sets this week, max volume set) on open
- `mobile/src/components/ExerciseRow.tsx` — summary card showing exercise name + per-set badges (`reps × weight`); tapping opens the drawer
- `mobile/src/components/WorkoutCard.tsx` — workout list card with date, duration, exercise names; deletion requires Alert confirmation

## Design system

- **Web**: Mantine v7, dark theme (`#0b0b0c` background, `#3de8a0` accent), Rajdhani + Barlow Condensed fonts
- **Mobile**: React Native Paper (Material Design 3), dark color scheme

## Exercise History Feature

Firestore collection: `userStats/{userId}/exercises/{exerciseKey}` where `exerciseKey` is a normalized camelCase slug via `normalizeExerciseKey()` (e.g. `"benchPress"`).

Document schema:

```json
{
  "exerciseName": "Bench Press",
  "allLifts": [{ "weight": 225, "reps": 8, "date": "2026-04-08" }],
  "computed": {
    "maxWeight": 245,
    "minWeight": 135,
    "medianWeight": 185,
    "setsThisWeek": 9,
    "setsWeekOf": "2026-04-28",
    "bestSetWeight": 102,
    "bestSetReps": 8
  }
}
```

`bestSetWeight`/`bestSetReps` represent the single set with the highest `weight × reps` ever. Displayed as "Max Volume" chip in `ExerciseEditDrawer` and `ExerciseHistorySheet` as `reps × weight` (no unit label in the chip).

`setsWeekOf` staleness check: if `setsWeekOf` ≠ current week's Monday, display `setsThisWeek` as 0.

### Implemented

- Core utilities in `src/core/services/exerciseHistory.ts`: `normalizeExerciseKey`, `computeStats`, `getCurrentWeekMonday`, `mergeLifts`
- Firestore read/write: `fetchExerciseHistory` and `upsertExerciseHistory` in `src/helperFunctions/FirestoreActions.tsx`
- History UI: embedded in `ExerciseEditDrawer` — fetched from Firestore when drawer opens; displays max, median, sets-this-week, and max-volume chips inline above the set list. `ExerciseHistorySheet` shows the same stats in a full-screen list view.
- Write hook: `mobile/hooks/useExerciseHistoryWriter.ts` — per-exercise 30s debounce timers, AppState flush on background/inactive, flush on unmount; exposes `flushKey(uuid, exercises)` for targeted single-key flush
- Mid-workout history read merges Firestore `allLifts` with current in-memory session sets client-side before computing stats
- Exercise rename handling: `exerciseNameChangeHandler` in `[workoutId].tsx` flushes the old key's pending timer, then calls `migrateExerciseHistory` which merges both keys' full `allLifts` arrays, writes to the new key, and deletes the old key — **needs manual testing** (see Testing section below)

### Testing checklist

**Exercise rename history (just fixed):**

1. Log sets under exercise "A" across multiple past workouts so `exerciseA` has historical data in Firestore.
2. In a new workout, add exercise "A", log 2+ sets (<30s so timer is still pending).
3. Rename to "B" — verify immediately: `userStats/{userId}/exercises/exerciseA` is deleted, `exerciseB` exists and contains both today's sets AND all prior historical lifts.
4. Open the history sheet for "B" — should show full history with no missing data.
5. Edge case: "B" already had its own history from a prior workout — verify both histories are merged (all lifts from both docs present in `exerciseB`).
6. Edge case: rename to same normalized key (e.g. "curl a" → "Curl A") — no flush or migration fires.

Advanced analytics (charts, 1RM, export) are reserved for a paid tier — do not implement.

## Roadmap

### P3

- ~~Workout list: split into time envelopes (this week / last week / older)~~ ✓ done
- ~~Volume history (free tier): track best set volume (reps×weight), total volume, volume this week, best week volume~~ ✓ done (max-volume set only: `bestSetWeight` + `bestSetReps`)

### P4

- RPE field on `SetEntry` data model (schema change, add to exercise logging UI)
- History refinement: aggregate stats by parent muscle group (e.g. Preacher Curl rolls up into Biceps summary)
