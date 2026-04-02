# Corpore Sano -- Mobile

The React Native / Expo companion app for [Corpore Sano](../README.md). Shares all business logic with the web app via the `@shared` alias while using React Native Paper for a native Material Design 3 UI.

## Tech Stack

- **Expo 54** with expo-router v5 (file-based routing, bottom tab navigation)
- **React Native 0.81** / React 19
- **React Native Paper** (Material Design 3) -- replaces Mantine from the web app
- **Redux Toolkit** -- same store and slices as web, imported via `@shared`
- **Firebase / Firestore** -- same backend, initialized with Expo env vars
- **Google Sign-In** -- `@react-native-google-signin/google-signin` with Firebase `signInWithCredential`

## Project Structure

```
mobile/
  app/                            # Expo Router file-based routes
    _layout.tsx                   #   Root: Redux Provider, PaperProvider, UserProfileContext
    (tabs)/
      _layout.tsx                 #   Bottom tab navigator (Dashboard / Workouts / Settings)
      index.tsx                   #   Dashboard screen
      workouts.tsx                #   Workouts screen (FlatList + FAB)
      settings.tsx                #   Settings screen
  src/
    components/
      ExerciseRow.tsx             #   Exercise input row (name, sets, reps, weight)
      GoogleSignIn.tsx            #   Google auth via signInWithCredential
      UserPreferences.tsx         #   Weight unit toggle, device color scheme display
      WeeklySummary.tsx           #   Paper DataTable of muscle group volume
      WorkoutCard.tsx             #   Workout card with inline editing
  babel.config.js                 # @shared alias via babel-plugin-module-resolver
  metro.config.js                 # watchFolders + nodeModulesPaths for shared code
  tsconfig.json                   # Extends expo/tsconfig.base, @shared + React type resolution
```

## What's Shared vs. Native

The mobile app reuses all business logic from the web app and only implements its own UI layer:

| Shared from `../src/` via `@shared` | Mobile-only |
|--------------------------------------|-------------|
| Redux store, slices, typed hooks | Expo Router layouts and screens |
| Domain types (Exercise, Workout, UserProfile) | React Native Paper components |
| Firestore CRUD (`FirestoreActions`) | Google Sign-In flow (`signInWithCredential`) |
| Muscle calculation services | Bottom tab navigation |
| Exercise catalog and muscle group data | Platform-specific Firebase init (`.native.ts`) |
| Date helpers, unit conversion utilities | |
| O(1) exercise lookup map | |

## How the `@shared` Alias Works

The alias is configured at three levels so TypeScript, Babel, and Metro all resolve it consistently:

**TypeScript** (`tsconfig.json`) -- editor support and type checking:
```json
"paths": { "@shared/*": ["../src/*"] }
```

**Babel** (`babel.config.js`) -- build-time import rewriting:
```js
["module-resolver", { alias: { "@shared": "../src" } }]
```

**Metro** (`metro.config.js`) -- bundler file resolution:
```js
config.watchFolders = [path.resolve(__dirname, "../src")];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];
```

The `nodeModulesPaths` entry for `../node_modules` is necessary because shared code imports packages like `firebase` and `@reduxjs/toolkit` that are installed at the root -- without it, Metro can't resolve those dependencies when bundling shared files.

The mobile `tsconfig.json` also sets `typeRoots` and explicit `paths` entries for `react` and `react-native` to ensure a single consistent set of React types across shared and mobile code, avoiding the duplicate `@types/react` conflict that arises from the web app's React 18 types in the root `node_modules`.
