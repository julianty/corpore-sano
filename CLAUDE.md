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

This is a monorepo with two apps sharing business logic. The web app's `src/` doubles as the shared code library — there is no separate `packages/shared` workspace.

### Code sharing via `@shared`

Mobile imports web source with `import { X } from "@shared/types"`. The alias is wired at three levels:
- **TypeScript** — `paths` in `mobile/tsconfig.json`
- **Babel** — `babel-plugin-module-resolver` in `mobile/babel.config.js`
- **Metro** — `watchFolders` + `nodeModulesPaths` in `mobile/metro.config.js`

Firebase initialization uses Metro's `.native.ts` extension convention: `src/initializeFirebase.native.ts` is auto-preferred over `src/initializeFirebase.tsx` in the RN build, giving each platform the correct env-var-based init.

### Shared vs. platform-specific

| Shared (`src/`, imported via `@shared`) | Web-only (`src/`) | Mobile-only (`mobile/`) |
|---|---|---|
| Redux store, slices, typed hooks | Mantine components | Expo Router layouts/screens |
| Domain types (`types.ts`) | SVG muscle diagram | React Native Paper components |
| `FirestoreActions` CRUD | Design tokens / Mantine theme | Bottom tab navigation |
| Muscle calculation services | | `.native.ts` Firebase init |
| Exercise catalog + muscle group data | | |
| Date helpers, unit conversion | | |

### Domain types (`src/types.ts`)

Core types: `Exercise`, `SetEntry`, `Workout`, `ExerciseMap`, `Muscle`, `MuscleSummary`, `UserProfile`.

`Workout.exercises` is an `ExerciseMap` (object keyed by UUID), not an array. Each `Exercise` holds a `SetEntry[]` with both `weightlbs` and `weightkg` stored.

### Firestore data model

```
users/{userId}/
  workouts/{workoutId}          # Workout docs (date, exercises, durationSeconds)
  preferences/userProfile       # UserProfile (weightUnit, colorScheme, customExercises, favoriteExercises)

userStats/{userId}/
  exercises/{exerciseKey}       # Per-exercise history (see exercise history feature)
```

All `FirestoreActions` live in `src/helperFunctions/FirestoreActions.tsx`. Reads use server-side `where`/`orderBy` push-down; never filter client-side.

### Business logic (`src/core/`)

Pure functions with no framework dependencies:
- `buildMuscleSummary(workouts, exerciseMap)` — returns per-muscle set counts and recency data
- `rollupToParentGroups(muscleSummary)` — aggregates fine-grained muscles into parent groups (Shoulders, Back, Chest, Arms, Core, Legs)

These are consumed identically by both web (`WeeklySummary`, `MuscleDiagram`) and mobile (`WeeklySummary`).

### Redux

Two slices in `src/features/`: `auth` (userId, displayName) and `exercises` (exercise catalog). The store is instantiated once in `src/store.ts` and imported via `@shared/store` on mobile. User profile state lives in React context (`UserProfileContext` in `mobile/app/_layout.tsx`), not Redux.

### Performance patterns

- `React.memo` on `ExerciseRow` and `ExerciseCombobox`
- `useMemo` for exercise catalog array (static data)
- `createExerciseMap` (`src/utils/exerciseLookup.ts`) for O(1) name lookups
- Debounced writes via `setTimeout`/`clearTimeout` pattern

## Testing

Jest with ts-jest. Firebase and Mantine ESM modules are stubbed in `__mocks__/` to keep tests fast.

Tests live alongside source: `src/core/services/muscleCalculations.test.ts`, `src/lib/utils.test.ts`.

## Mobile routing

expo-router file-based routes:
```
mobile/app/
  _layout.tsx              # Root: Redux Provider + auth gate + UserProfileContext
  (tabs)/
    _layout.tsx            # Bottom tab navigator
    index.tsx              # Dashboard
    workouts/              # Workouts list + per-workout detail
  workout-mode/
    [workoutId].tsx        # Active workout editing screen
```

**Future update:** Plan to remove the `workout-mode/` route entirely — revisit this when ready to migrate or consolidate active workout editing.

## Design system

- **Web**: Mantine v7, dark theme (`#0b0b0c` background, `#3de8a0` accent), Rajdhani + Barlow Condensed fonts
- **Mobile**: React Native Paper (Material Design 3), dark color scheme

## Exercise History Feature (in progress)

New Firestore collection: `userStats/{userId}/exercises/{exerciseKey}` where `exerciseKey` is a normalized lowercase slug (e.g. `"bench-press"`).

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

### What's implemented

- All core utilities in `src/core/services/exerciseHistory.ts`: `normalizeExerciseKey`, `computeStats`, `getCurrentWeekMonday`, `mergeLifts`
- Firestore read/write: `fetchExerciseHistory` and `upsertExerciseHistory` in `src/helperFunctions/FirestoreActions.tsx`
- History UI: `mobile/components/ExerciseHistorySheet.tsx` — triggered by history icon on each exercise card, fetches and merges session sets on open
- Write hook: `mobile/hooks/useExerciseHistoryWriter.ts` — currently writes immediately on every set change (no debounce)

### Next: re-add debounce to `useExerciseHistoryWriter`

Debounce logic lives entirely inside the hook. Rules:
- **Per-exercise timers** — each exercise key has its own 30s timer; logging a set resets only that exercise's timer
- **AppState flush** — on `AppState` → `background` or `inactive`, flush all pending timers immediately (fire all queued writes regardless of which exercise/workout)
- **After flush, timer clears** — on foreground return, no timer is re-armed; next set log starts a fresh 30s timer

On mid-workout history read, merge Firestore `allLifts` with current in-memory session sets client-side before computing stats.

### Known gap: exercise deletion cleanup

Removing an exercise card from a workout calls `closeHandler(key)` which deletes the exercise from the workout doc, but does not delete the corresponding `userStats/{userId}/exercises/{exerciseKey}` document. That Firestore doc must also be deleted when an exercise is removed.

Advanced analytics (charts, 1RM, export) are reserved for a paid tier — do not implement.
