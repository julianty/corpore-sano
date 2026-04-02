# Corpore Sano

A cross-platform fitness tracking app for logging workouts, monitoring weekly volume by muscle group, and identifying training gaps.

**[Live demo](https://corpore-sano-2e626.web.app/)** -- sign in with Google or use demo mode.

## Features

- **Workout Tracking** -- Log exercises with sets, reps, and weight. Add custom exercises or pick from the built-in catalog.
- **Weekly Muscle Summaries** -- Estimated weekly sets per muscle group, with recency tracking. Based on the concept of minimum effective volume (MEV) to flag understimulated groups.
- **Muscle Diagram** -- Visual heatmap of muscle group activity over the past week.
- **Google Sign-In** -- Firebase Auth with Google identity on both web and mobile.
- **Unit Preferences** -- Switch between lbs and kg; synced to Firestore per user.
- **Export** -- Export workout data to CSV or XLS.

## Tech Stack

| Layer | Web | Mobile |
|-------|-----|--------|
| Framework | React 18 + Vite | React Native 0.81 + Expo 54 |
| UI Library | Mantine v7 | React Native Paper (MD3) |
| State | Redux Toolkit | Redux Toolkit (shared) |
| Backend | Firebase / Firestore | Firebase / Firestore (shared) |
| Auth | Firebase Auth + Google | Firebase Auth + Google Sign-In |
| Routing | Single-page (Vite SPA) | expo-router v5 (file-based tabs) |
| Testing | Jest + ts-jest | -- |

## Architecture

This is a monorepo with two apps -- a React web app and a React Native mobile app -- that share business logic. Rather than extracting a separate `packages/shared` workspace, the web app source (`src/`) doubles as the shared code library. The mobile app imports from it via a `@shared` path alias, keeping the setup lightweight while avoiding any code duplication.

### Repository structure

```
corpore-sano/
  src/                            # Web app source + shared business logic
    components/                   # Web-only UI (Mantine)
      Auth/                       #   Google login
      Dashboard/                  #   Dashboard, WeeklySummary, MuscleDiagram
      WorkoutTool/                #   Workout editing UI
      common/                     #   ErrorBoundary, LoadingOverlay
    core/                         # Platform-agnostic domain logic (shared)
      repositories/               #   IWorkoutRepository, IUserRepository interfaces
      services/                   #   muscleCalculations: buildMuscleSummary, rollupToParentGroups
    data/                         # Exercise catalog, muscle group definitions (shared)
    features/                     # Redux slices: auth, exercises (shared)
    helperFunctions/              # Firestore CRUD, date utilities (shared)
    lib/                          # Unit conversion helpers (shared)
    utils/                        # O(1) exercise name lookup via Map (shared)
    styles/                       # Design tokens, Mantine theme, responsive helpers (web-only)
    assets/                       # SVG muscle diagram components (web-only)
    store.ts                      # Redux store (shared)
    hooks.ts                      # Typed useAppDispatch / useAppSelector (shared)
    types.ts                      # Domain types: Exercise, Workout, UserProfile (shared)
    initializeFirebase.tsx        # Web Firebase init (VITE_* env vars)
    initializeFirebase.native.ts  # Mobile Firebase init (EXPO_PUBLIC_* env vars)
  mobile/                         # React Native / Expo app (see mobile/README.md)
  __mocks__/                      # Jest mocks for Firebase and Mantine ESM
  firestore.rules                 # Firestore security rules
```

### Cross-platform code sharing

The mobile app imports shared modules with `@shared` (e.g. `import { Exercise } from "@shared/types"`). The alias is wired at three levels so that TypeScript, Babel, and Metro all resolve it consistently:

1. **TypeScript** -- `paths` in `mobile/tsconfig.json` maps `@shared/*` to `../src/*` for type checking and editor support.
2. **Babel** -- `babel-plugin-module-resolver` in `mobile/babel.config.js` rewrites the imports at build time.
3. **Metro** -- `watchFolders` in `mobile/metro.config.js` tells the bundler to watch `../src`, and `nodeModulesPaths` includes the root `node_modules` so shared code can resolve packages like `firebase` that are installed at the root.

Firebase initialization is handled via Metro's `.native.ts` extension convention: `initializeFirebase.native.ts` is automatically preferred over `initializeFirebase.tsx` in the React Native build, giving each platform the correct init without conditional imports or environment sniffing.

### Domain logic layer

Business logic lives in `src/core/services/` as pure functions with no framework dependencies:

- **`buildMuscleSummary`** -- Takes an array of workouts and an exercise catalog map, returns per-muscle set counts and recency data.
- **`rollupToParentGroups`** -- Aggregates fine-grained muscle data into parent groups (Shoulders, Back, Chest, Arms, Core, Legs).

Both the web `WeeklySummary` / `MuscleDiagram` components and the mobile `WeeklySummary` component consume these functions identically. Repository interfaces (`IWorkoutRepository`, `IUserRepository`) define the data access contract for testability and to document the boundary between UI and persistence.

### Performance considerations

- **`React.memo`** on `ExerciseRow` and `ExerciseCombobox` to prevent re-renders during workout editing.
- **`useMemo`** for the exercise catalog array (static data, computed once).
- **Map-based O(1) lookups** via `createExerciseMap` -- used in both `WeeklySummary` and `MuscleDiagram` instead of repeated array scans.
- **Firestore query push-down** -- `fetchWorkoutsAfterDate` and `fetchWorkoutIds` use server-side `where`/`orderBy` rather than client-side filtering.
- **Debounced writes** -- `updateFavoriteExercises` uses a `setTimeout`/`clearTimeout` pattern to batch rapid changes.

## Testing

Tests use Jest with ts-jest. Firebase and Mantine ESM modules are stubbed via `__mocks__/firebase.cjs` and `__mocks__/mantine.cjs` to keep test execution fast and isolated.

- `src/core/services/muscleCalculations.test.ts` -- 16 tests covering `buildMuscleSummary` and `rollupToParentGroups`
- `src/lib/utils.test.ts` -- Unit conversion and general utility functions

## License

GPL v2 -- see [LICENSE](./LICENSE).
