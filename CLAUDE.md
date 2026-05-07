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

| Shared (`src/`, via `@shared`) | Web-only | Mobile-only (`mobile/`) |
|---|---|---|
| Redux store, slices, typed hooks | Mantine components | Expo Router layouts/screens |
| Domain types (`types.ts`) | SVG muscle diagram | React Native Paper components |
| `FirestoreActions` CRUD | Design tokens / Mantine theme | Bottom tab navigation |
| Muscle calculation services | | `.native.ts` Firebase init |
| Exercise catalog + muscle group data | | |
| Date helpers, unit conversion | | |

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
    workouts/              # Workouts list + per-workout detail
  workout-mode/
    [workoutId].tsx        # Active workout editing screen (to be replaced by drawer)
```

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
    "maxWeight": 245, "minWeight": 135, "medianWeight": 185,
    "setsThisWeek": 9, "setsWeekOf": "2026-04-28"
  }
}
```

`setsWeekOf` staleness check: if `setsWeekOf` ≠ current week's Monday, display `setsThisWeek` as 0.

### Implemented

- Core utilities in `src/core/services/exerciseHistory.ts`: `normalizeExerciseKey`, `computeStats`, `getCurrentWeekMonday`, `mergeLifts`
- Firestore read/write: `fetchExerciseHistory` and `upsertExerciseHistory` in `src/helperFunctions/FirestoreActions.tsx`
- History UI: `mobile/components/ExerciseHistorySheet.tsx` — triggered by history icon on exercise card
- Write hook: `mobile/hooks/useExerciseHistoryWriter.ts` — per-exercise 30s debounce timers, AppState flush on background/inactive, flush on unmount
- Mid-workout history read merges Firestore `allLifts` with current in-memory session sets client-side before computing stats

### Known bugs (P1)

**Custom exercise Firebase errors:** `normalizeExerciseKey` uses `.replace(/[^a-z0-9]+(.)/g, ...)` which can produce invalid Firestore document ID characters (e.g. trailing special chars like `)` in `"Row (Cable)"` are not captured and pass through). Fix: sanitize the output to strip any remaining non-alphanumeric characters after transformation.

**Exercise rename orphans history:** When a user swaps exercise name mid-workout, `exerciseNameChangeHandler` updates the workout doc but never triggers a history flush for the old key. Subsequent set-logs write to the new key, leaving the old key's sets unwritten. Fix: flush the old key's pending timer before applying the rename, then start a fresh timer under the new key.

**Exercise deletion orphans history doc:** `closeHandler(key)` deletes the exercise from the workout doc but not the corresponding `userStats/{userId}/exercises/{exerciseKey}` Firestore document.

Advanced analytics (charts, 1RM, export) are reserved for a paid tier — do not implement.

## Roadmap

### P1 — Bugs
- Fix custom exercise history Firebase errors (invalid Firestore key from special chars)
- Fix exercise rename orphaning history (flush old key before rename, rekey timer)
- Fix exercise deletion not cleaning up history doc

### P2 — Next features
- Workout list: sort by date descending
- "Are you sure" dialogs for deletion (exercises and workouts)
- Drawer replaces inline editing in workout mode — `workout-mode/[workoutId].tsx` is removed; exercise editing moves into a bottom drawer launched when an exercise is selected

### P3
- Workout list: split into time envelopes (this week / last week / older)
- Volume history (free tier): track best set volume (reps×weight), total volume, volume this week, best week volume

### P4
- RPE field on `SetEntry` data model (schema change, add to exercise logging UI)
- History refinement: aggregate stats by parent muscle group (e.g. Preacher Curl rolls up into Biceps summary)
