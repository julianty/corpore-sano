# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an npm **workspaces** monorepo. Run `npm install` once from the repo
root — it installs both the root package and the `mobile` workspace into a
single hoisted root `node_modules` with one root `package-lock.json`. Never
run `npm install` inside `mobile/`.

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

(`npm run ios --workspace mobile` from the root works too, but `cd mobile`
then run is the primary documented flow.) No test suite exists for the mobile
app yet.

## Architecture

npm **workspaces** monorepo with two apps sharing business logic. Root
`package.json` declares `"workspaces": ["mobile"]`; the web app and the
`mobile/` Expo app install into one hoisted root `node_modules` with a single
root `package-lock.json` (`mobile/` has no lockfile and, for hoistable deps,
no `node_modules` of its own). The web app's `src/` doubles as the shared
library — no separate `packages/shared` workspace.

### Code sharing via `@shared`

Mobile imports web source with `import { X } from "@shared/types"`. Wired at three levels: TypeScript `paths` in `mobile/tsconfig.json`, `babel-plugin-module-resolver` in `mobile/babel.config.js`, and `watchFolders`/`nodeModulesPaths` in `mobile/metro.config.js`.

Firebase init uses Metro's `.native.ts` extension: `src/initializeFirebase.native.ts` is auto-preferred over `src/initializeFirebase.tsx` in the RN build.

**Shared dependencies must use compatible version ranges in both `package.json` files.** Because this is a workspace, npm only hoists a package to a single physical copy when every workspace's declared range converges on one resolvable version. A non-overlapping mismatch forces npm to nest a second copy under `mobile/node_modules`, and any dependency whose runtime relies on a single instance then breaks:

- **`react`**: pinned to the exact same version in both (`19.1.0`, no caret) — React's hooks dispatcher / context is a process-wide singleton, so two copies throw `TypeError: Cannot read property 'useContext' of null` at startup. The mobile toolchain (Expo / React Native) dictates the React version; the web app follows it.
- **`firebase`**: root-only (not in `mobile/package.json`); shared `src/` code imports it and it hoists to the single root copy. Never add `firebase` to `mobile/package.json` — a second SDK copy splits Auth and Firestore onto separate app instances, and Firestore requests stop carrying `request.auth`. Auth (`mobile/src/lib/auth.ts`) reuses the shared `app` exported by `initializeFirebase.native.ts`.

When bumping a dep used by both apps, change it in both places (mobile's toolchain-driven version wins on conflict) and re-run `npm install` from the root.

**`expo-router` is also declared in the root `package.json`** even though only the mobile app uses it. This is deliberate, not a stray dep: `babel-preset-expo` hoists to the root and decides whether to enable its expo-router transform (the one that inlines `EXPO_ROUTER_APP_ROOT` into `require.context`) via `require.resolve('expo-router')` **from the root**. Left to npm's hoisting, expo-router nests under `mobile/node_modules` (its `@react-navigation` / `@expo/metro-runtime` subtree conflicts with root versions), so the preset can't find it and every mobile bundle fails with `Invalid call ... require.context should be a string`. Declaring `expo-router` at the root forces a single copy into the root `node_modules` where the preset resolves it. The web build ignores it (Vite only bundles imports, `tsc` only includes `src/`). Keep its range in sync with `mobile/package.json`. Relatedly, `@reduxjs/toolkit` must be `>=2.5.0` in both — earlier 2.x declares a React-18-only peer that blocks installing expo-router at the root alongside React 19.

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

`Workout.exercises` is an `ExerciseMap` (object keyed by UUID) — a real nested sub-map on the doc, alongside `date`/`durationSeconds`. Always read a workout's exercises via `getExerciseEntries(workout)` in `src/core/services/workoutShape.ts`; never scan the doc's own keys and filter out `date` (scalar fields like `durationSeconds` would be mistaken for exercises). Each `Exercise` holds a `SetEntry[]` with both `weightlbs` and `weightkg` stored.

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

### Web authentication (`src/App.tsx`)

The web app has **no login gate** and defaults to the shared `"demoUser"`
account (initial Redux `auth.userId`). The Firestore rules require
`request.auth != null` on **every** path — including the `users/demoUser` /
`userStats/demoUser` sandbox — so the web app must establish a session or every
read/write is permission-denied. `App.tsx` does this: an `onAuthStateChanged`
listener calls `signInAnonymously` whenever no session exists, and both the
demo-data and profile-fetch effects are gated on an `authReady` flag so they
never fire before that session resolves. **Never remove the anonymous-auth
listener or the `authReady` gate** — doing so silently breaks all web Firestore
access (this exact regression happened on `ios-build`, which ported the rules
lockdown but not the anon-auth logic).

### Mobile authentication (`mobile/src/lib/auth.ts`)

Email/password and Google Sign-In, both landing on the single shared Firebase
`auth` instance so Firestore requests carry `request.auth`.

- **Google** uses `@react-native-google-signin/google-signin` (declared in
  `mobile/package.json`, hoisted to root). `signInWithGoogle()` runs the native
  flow, reads the id_token from the **v13+ response shape** (`response.data.idToken`
  via `isSuccessResponse()` — not the old `userInfo.idToken`), then exchanges it
  through the Firebase JS SDK's `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`.
  Web still uses `signInWithPopup` (`src/components/Auth/GoogleLogin.tsx`) — popup/redirect don't work in RN.
- **`GoogleSignin.configure`** needs both `webClientId` (this is what makes the
  id_token acceptable to Firebase — the *web* OAuth client, not the iOS one) and
  `iosClientId`. Both are public OAuth client IDs and live in `auth.ts`.
- **Native module → no Expo Go.** Requires a dev build (`expo prebuild` +
  `expo run:ios`). Three config pieces in `mobile/app.json` are load-bearing:
  the google-signin plugin with an explicit `iosUrlScheme` (the plist's
  `REVERSED_CLIENT_ID`; without it the Expo 54 build ships without the URL
  scheme and sign-in fails with "missing URL scheme"), `ios.googleServicesFile`
  pointing at `GoogleService-Info.plist`, and **`expo-build-properties` with
  `ios.useFrameworks: "static"`** — the GoogleSignin iOS SDK pulls in Swift pods
  (`AppCheckCore`/`GoogleUtilities`/`RecaptchaInterop`) that won't link as static
  libraries otherwise, so `pod install` fails without it.
- **Android is not wired yet** — needs an Android app registered in Firebase +
  SHA-1 fingerprints + `google-services.json`. The JS code path is already
  cross-platform.

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
- **Mobile**: Custom theme via `useAppTheme()` hook (`mobile/hooks/useAppTheme.ts`). Supports light, dark, and system color schemes. The resolved scheme is exposed as `resolvedColorScheme` on `UserProfileContext` and persisted to Firestore as `UserProfile.colorScheme` (`"light" | "dark" | "system"`).

### Mobile theme tokens (`AppColors`)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#fff` | `#111114` | Screen backgrounds |
| `surface` | `#f5f5f5` | `#1c1c20` | Cards, bottom sheets, tab bar |
| `surfaceVariant` | `#f0f0f0` | `#252528` | Chips, badges, secondary buttons |
| `border` | `#ddd` | `#2e2e34` | Card/sheet borders, dividers |
| `borderSubtle` | `#eee` | `#222226` | Hairline separators |
| `borderInput` | `#ccc` | `#3a3a40` | Text inputs, toggle buttons |
| `handle` | `#ddd` | `#3a3a40` | Drawer drag handles |
| `overlay` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` | Modal backdrops |
| `textPrimary` | `#111` | `#ebebeb` | Main content text |
| `textSecondary` | `#555` | `#aaa` | Labels, subdued text |
| `textMuted` | `#999` | `#666` | Placeholders, hints |
| `textInverse` | `#fff` | `#fff` | Text on accent/colored backgrounds |
| `accent` | `#007AFF` | `#007AFF` | Interactive primary (buttons, links) |
| `accentSubtle` | `#eef4ff` | `#1a2a3a` | Pressed states, tinted backgrounds |
| `danger` | `#cc3300` | `#ff4422` | Destructive text/borders |
| `dangerBg` | `#f44336` | `#f44336` | Destructive button backgrounds |

All mobile components consume `useAppTheme()` — never use hardcoded hex colors. Tab bar and stack header are themed via `screenOptions` in their respective `_layout.tsx` files.

## Exercise History Feature

Firestore collection: `userStats/{userId}/exercises/{exerciseKey}` where `exerciseKey` is a normalized camelCase slug via `normalizeExerciseKey()` (e.g. `"benchPress"`).

Document schema:

```json
{
  "exerciseName": "Bench Press",
  "allLifts": [{ "weight": 102, "reps": 8, "date": "2026-04-08", "workoutId": "aB3xY..." }],
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

Lift `weight` values are stored in **kg** (converted for display). Every lift carries the `workoutId` it was logged in: merging replaces only that workout's lifts (`mergeLifts`) and deleting a workout/exercise removes only that workout's lifts (`removeWorkoutLifts`) — never match by weight/reps signature or date alone, since same-day workouts and repeated weights are common. `src/migrateLiftWorkoutIds.ts` rebuilds all history docs from workout docs (run with `npx tsx`, supports `--dry-run` and explicit user-ID args).

`bestSetWeight`/`bestSetReps` represent the single set with the highest `weight × reps` ever. Displayed as "Max Volume" chip in `ExerciseEditDrawer` and `ExerciseHistorySheet` as `reps × weight` (no unit label in the chip).

`setsWeekOf` staleness check: if `setsWeekOf` ≠ current week's Monday, display `setsThisWeek` as 0.

### Implemented

- Core utilities in `src/core/services/exerciseHistory.ts`: `normalizeExerciseKey`, `computeStats`, `getCurrentWeekMonday`, `mergeLifts`, `removeWorkoutLifts`
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

### P2

- ~~Fix dark mode — device setting not being read correctly; wire up a manual override toggle in settings~~ ✓ done
- UI update — mock up and implement UI improvements across the app

### P3

- ~~Workout list: split into time envelopes (this week / last week / older)~~ ✓ done
- ~~Volume history (free tier): track best set volume (reps×weight), total volume, volume this week, best week volume~~ ✓ done (max-volume set only: `bestSetWeight` + `bestSetReps`)
- ~~Today indicator on workout list — badge on `WorkoutCard` when `workout.date` is today~~ ✓ done
- ~~Exercise picker shortcut — `+ Add Exercise` opens `ExercisePickerModal` directly; dismissing without selecting creates no exercise (no intermediate empty card)~~ ✓ done

### P4

- Weighted volume on dashboard — replace set counts with volume weighted by muscle activation; build a lookup table mapping ~20-30 compound lifts to primary/secondary movers (simple hand-curated splits, not full EMG percentages); update `buildMuscleSummary` / `rollupToParentGroups` to output weighted volume
- 2-week activity feed on dashboard — new component below `WeeklySummary` showing last 2 weeks of workouts (date, duration, exercise names); new Firestore fetch, no schema change
- Set types on `SetEntry` — add optional `type?: 'normal' | 'warmup' | 'amrap'` field; warm-up sets excluded from history stats (max weight, median, volume); AMRAP counted normally; UI in `ExerciseEditDrawer` set rows; non-breaking schema change (backfill as 'normal')
- Muscle group history — inline "last week" column added to `WeeklySummary` table; rows become tappable, opening a detail screen with 4-week sets-per-week breakdown + last worked date; requires expanding Firestore query window beyond current 7-day limit
- RPE field on `SetEntry` data model (schema change, add to exercise logging UI)
- Custom-exercise → catalog migration (reusable) — let a user re-point a mistakenly-created custom exercise onto an existing catalog exercise, carrying set/history data over. Today both workout entries and history docs are keyed by `normalizeExerciseKey(variant)` (a name-derived string), so migrating means rewriting the name/variant on every workout entry + moving/merging the `userStats/{userId}/exercises/{key}` history doc.
- Investigate changing how custom-exercise logs are referenced — workouts and history currently reference exercises by **name string** (`name`/`variant`, history key = normalized variant), even though `Exercise.customExerciseId` already exists. If logs referenced a stable **exercise ID** instead (and history were keyed by ID), a custom→catalog migration would collapse to a single reference swap (repoint the ID) rather than rewriting every workout entry and rebuilding name-derived history keys. Evaluate the schema change + backfill cost vs. the migration simplification it buys. (See the `ExerciseHistory` "Do I need unique exercise IDs?" TODO in `src/types.ts`.)

### P5

- ~~Google OAuth sign-in — alongside existing email/password flow~~ ✓ done on iOS (see [Mobile authentication](#mobile-authentication-mobilesrclibauthts)); Android still needs Firebase Android app + SHA-1 + `google-services.json`
