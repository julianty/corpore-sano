# Launch Readiness Audit — 2026-08-17

**Audit date:** 2026-08-17 · **Branch audited:** `main` @ `00014db`
**Scope:** everything on the path to shipping the iOS app + web app — mobile app (`mobile/`), shared `src/`, Firestore rules, and build/release config.
**Method:** static code review + runtime probes of module resolution + `tsc`/`jest` runs. No code changed, app not run on device.
**Severity guide:** Blocker = the shipped build is broken in a way local dev hides · High = silent data loss/corruption or unbounded cost in normal use · Medium = latent trap, user-visible wrongness in edge cases, or missing safety net.

**Baseline at audit time:** web `tsc --noEmit` clean · `npm test` 65/65 passing · mobile `tsc --noEmit` **5 errors** (tracked as LR-10).

**Related:** [`diagnostics-2026-06-12.md`](./diagnostics-2026-06-12.md) — earlier audit. Its C1/C2/H3 are fixed; its H1/H2 and several mediums may still be open. IDs in that file (`C1`, `H1`, …) are **not** the same as IDs here (`LR-01`, …). Don't confuse them.

---

## How to use this file

This file is the work queue for the launch fixes. It is fed to agents one task at a time. Each task is self-contained — an agent should not need any other context beyond this file and the repo.

### The protocol — five steps per task, in order

Work **one task at a time**. Do not batch tasks, and do not fix problems you notice outside the task you were given (note them in the Findings log at the bottom instead).

1. **Verify** — Reproduce/confirm the finding *before* changing anything. Each task has a **Verify** block with a concrete command or inspection. If the finding does not reproduce, **stop and report** — do not fix it. The code may have changed since 2026-08-17, or the audit may have been wrong (see LR-08 for one the audit initially got wrong).
2. **Fix** — Make the smallest change that resolves the finding. Follow the **Fix direction** but treat it as a direction, not a spec — if you find a better approach, say so in your report. Match surrounding code style. Do not refactor adjacent code.
3. **Review** — Re-read your own diff against the task's **Done when** criteria. Check specifically: did you introduce an unhandled promise, a hardcoded hex color (mobile uses `useAppTheme()` tokens only), a second copy of a hoisted dep, or a change to `src/` that breaks the web app? Shared `src/` is consumed by **both** apps — a change there must work on web and mobile.
4. **Test** — Run the gates, then the task's **Test** block:
   - Always: `npm test` and `npx tsc --noEmit` from the repo root (web), and `npx tsc --noEmit` from `mobile/`.
   - If the fix touches shared `src/`: add or extend a Jest test. Tests live alongside source (`src/core/services/*.test.ts`).
   - If the fix is mobile-only UI/native with no test harness: **write an exact simulator script** — numbered steps, what to tap, what you should see — and put it in your report for the human to run. Do not mark the task done on the human's behalf.
5. **Commit** — Branch per task, then open a PR:
   ```bash
   git checkout main && git pull
   git checkout -b fix/LR-XX-short-slug
   # ... work ...
   git commit   # message: "LR-XX: <what changed>" + why, in the body
   gh pr create --title "LR-XX: <summary>" --body "..."
   ```
   Never commit directly to `main`. One task per branch and PR — do not stack unrelated fixes.

### Updating status

After a PR is opened, edit this file's **Status** field for that task (`Open` → `PR #N`) and add a line to the Findings log. Status values: `Open` · `In progress` · `PR #N` · `Merged` · `Won't fix (reason)` · `Not reproducible (reason)`.

### Repo facts an agent needs

- **npm workspaces monorepo.** Run `npm install` from the **repo root only** — never inside `mobile/`. One hoisted root `node_modules`, one root `package-lock.json`.
- **Mobile imports shared web source** via `@shared/*` → root `src/`. Wired in `mobile/tsconfig.json` (paths), `mobile/babel.config.js` (module-resolver), `mobile/metro.config.js` (watchFolders/nodeModulesPaths).
- **Never add `firebase` or `react` to `mobile/package.json`.** A second copy splits the SDK/hooks singleton and breaks auth→Firestore credential passing. See root `CLAUDE.md`.
- **Mobile has no test suite.** Jest covers root `src/` only.
- **Mobile colors** come from `useAppTheme()` (`mobile/hooks/useAppTheme.ts`). No hardcoded hex.
- Commands: root `npm run dev` / `npm run build` / `npm run lint` / `npm test`; mobile `cd mobile && npm run ios`.

---

## Task index

| ID | Sev | Status | Title | Primary file |
|---|---|---|---|---|
| LR-01 | Blocker | PR #1 | EAS production build ships with no Firebase config | `mobile/eas.json` |
| LR-02 | Blocker | Open | "Continue as Demo" never authenticates → all Firestore denied | `mobile/src/components/LoginScreen.tsx` |
| LR-03 | Blocker | Merged | `userInterfaceStyle: "light"` breaks system dark mode | `mobile/app.json` |
| LR-04 | High | Open | UTC date slice writes history under the wrong day | `mobile/hooks/useWorkoutEditor.ts:97` |
| LR-05 | High | Open | Workout list is unbounded + N+1, refetches on every focus | `mobile/app/(tabs)/workouts/index.tsx` |
| LR-06 | High | Open | Workout writes fail silently (unawaited, uncaught) | `mobile/hooks/useWorkoutEditor.ts:41` |
| LR-07 | High | Open | No ErrorBoundary on mobile — any render throw white-screens | `mobile/app/_layout.tsx` |
| LR-08 | Medium | Open | `initializeAuth` bare catch can silently downgrade persistence | `mobile/src/lib/auth.ts:27` |
| LR-09 | Medium | Open | Previous user's profile bleeds into a new account | `mobile/app/_layout.tsx:68` |
| LR-10 | Medium | Merged | Mobile `tsc` fails (5 errors) — no typecheck gate | `mobile/` |
| LR-11 | Medium | Open | `addNewExercise` key collision on `Date.now()` | `mobile/hooks/useWorkoutEditor.ts:111` |
| LR-12 | Medium | Open | `users/demoUser` is writable by any authenticated user | `firestore.rules` |

Recommended order: LR-01 → LR-03 (blockers, independent of each other) → LR-10 (gets the typecheck gate green so later tasks have a working signal) → LR-04 → LR-06 → LR-07 → LR-05 → LR-08 → LR-09 → LR-11 → LR-12.

> **Dependency note:** LR-02 and LR-12 both touch demo-mode auth. Do LR-02 first; LR-12 may become trivial or moot afterward.

---

# Blockers

These three break the **shipped** build specifically. All three are invisible in local development, which is why they survived to launch.

## LR-01 — EAS production build ships with no Firebase config

- **Status:** PR #1 (open, not merged) — code fix complete and gates pass; final verification blocked on the human purchasing an Apple Developer Program account, needed to produce a signed cloud build to test on device. No further agent action needed until that's done.
- **Where:** `mobile/eas.json` (no `env` or `environment` on any profile) · `mobile/.env` (gitignored via `mobile/.gitignore`) · consumed by `src/initializeFirebase.native.ts:5-11`.
- **What:** `initializeFirebase.native.ts` reads six `EXPO_PUBLIC_FIREBASE_*` vars from `process.env`. Those live only in `mobile/.env`, which is gitignored and therefore absent from the EAS build context. `mobile/eas.json` declares no `env` block and no `"environment"` key on the `production` profile — and without `"environment"`, EAS dashboard environment variables are not applied to the profile either. So the production bundle inlines `undefined` for every value and calls `initializeApp({ apiKey: undefined, ... })`.
- **Failure sequence:** `expo run:ios` locally works (the `.env` file is on disk) → EAS production build succeeds with no error → installed app cannot reach Firebase at all. Auth throws `auth/invalid-api-key`; nothing loads. **This only manifests in the build you ship to users.**
- **Fix direction:** Either (a) add an `env` block to the `production` (and `preview`) profiles in `mobile/eas.json` with the six values — they are public client identifiers, not secrets, and the same values already ship inside `GoogleService-Info.plist`; or (b) set them as EAS dashboard environment variables **and** add `"environment": "production"` to the profile so they are actually applied. Prefer (a) for reproducibility unless the human wants dashboard-managed config. Do the same for the `preview` profile or preview builds break identically.
- **Verify:**
  ```bash
  cd mobile && cat eas.json && cat .gitignore | grep -n env
  git check-ignore -v mobile/.env          # from repo root — confirms it is not committed
  sed 's/=.*/=<set>/' mobile/.env          # confirms the six vars exist locally only
  ```
  Confirmed if `eas.json` has no `env`/`environment` key and `.env` is ignored.
- **Test:** No unit test possible. Run `npx expo config --type public` in `mobile/` before and after to show config resolution, then hand the human this script: **(1)** run `eas build --profile preview --platform ios`, **(2)** install the resulting build on a device/simulator, **(3)** confirm the login screen appears and an email/password sign-in succeeds — not an `auth/invalid-api-key` error.
- **Done when:** A cloud build produced from a clean checkout (no local `.env`) reaches Firebase successfully. Verify the clean-checkout part explicitly — that is the whole point of the task.

## LR-02 — "Continue as Demo" never authenticates; every Firestore call is denied

- **Status:** Open
- **Where:** `mobile/src/components/LoginScreen.tsx:141-143` (`onPress={onDemoMode}`) · `mobile/app/_layout.tsx:30` (`demoMode` state), `:90` (`isAuthenticated`), `:103` (`<LoginScreen onDemoMode={() => setDemoMode(true)} />`) · `firestore.rules` (`users/demoUser` + `userStats/demoUser` blocks).
- **What:** `onDemoMode` only flips a React flag. No Firebase session is ever created. But every rule in `firestore.rules` — including the `users/demoUser` and `userStats/demoUser` sandbox blocks — requires `request.auth != null`. So in demo mode every read and write is permission-denied. `updateDemoData()` (fired by `mobile/app/_layout.tsx:62-66` when demo mode is entered) fails the same way, unhandled.
- **Failure sequence:** User taps "Continue as Demo" → lands in the app → dashboard, workout list and stats are all empty, every write silently fails, no error is shown. The demo path is the first thing an App Store reviewer or a curious new user will tap.
- **Fix direction:** Call `signInAnonymously` before entering demo mode, mirroring what the web app already does at `src/App.tsx:41-50`. Make `onDemoMode` async: await the anonymous sign-in, then `setDemoMode(true)`; surface a real error on the login screen if it fails. Note the interaction with `isAuthenticated` at `mobile/app/_layout.tsx:90` (`demoMode || userId !== "demoUser"`) — an anonymous session gives a real `uid`, so the auth listener will dispatch `logInUser` with that uid and the app would read `users/<anon-uid>` (empty) rather than `users/demoUser`. **Decide deliberately** which of these is wanted and say which you chose:
  - keep demo data shared at `users/demoUser` → the anon session must not overwrite the Redux `userId`, or
  - let each demo user get their own empty anonymous sandbox → simpler and safer, but "demo" then shows nothing to explore, which defeats its purpose.
  The web app's behavior (`src/App.tsx`) is the reference for what "demo" is supposed to look like — read it before choosing.
- **Verify:** Read the three cited locations and confirm no `signInAnonymously` import exists anywhere under `mobile/`:
  ```bash
  grep -rn "signInAnonymously" mobile/ --exclude-dir=node_modules   # expect: no matches
  grep -rn "signInAnonymously" src/                                  # expect: src/App.tsx (web reference)
  ```
- **Test:** Simulator script for the human: **(1)** sign out / fresh install, **(2)** tap "Continue as Demo", **(3)** confirm the dashboard shows demo workouts rather than an empty state, **(4)** create a workout and add a set, **(5)** force-quit, reopen, re-enter demo, confirm the set persisted, **(6)** check the Xcode/Metro console for zero `permission-denied` errors throughout.
- **Done when:** Demo mode performs real reads and writes with no permission errors, and the chosen demo-data semantics are documented in the PR body.

## LR-03 — `userInterfaceStyle: "light"` pins the app light; "system" dark mode never resolves

- **Status:** Merged (PR #2)
- **Where:** `mobile/app.json` (`"userInterfaceStyle": "light"`) · `mobile/app/_layout.tsx:32` (`useColorScheme() ?? "dark"`), `:99-100` (`resolvedColorScheme`) · `mobile/hooks/useAppTheme.ts:63-67`.
- **What:** `userInterfaceStyle: "light"` makes Expo write `UIUserInterfaceStyle = Light` into `Info.plist`, which pins the app's iOS trait collection to light. `useColorScheme()` therefore always returns `"light"`, so `resolvedColorScheme` is always `"light"` whenever `userProfile.colorScheme === "system"` — which is the **default for every new user** (`mobile/app/_layout.tsx:34-38`). The manual `"dark"` override still works, because it never consults the device.
- **Failure sequence:** A user with their phone in dark mode installs the app → app renders light → they never see dark mode unless they find the manual toggle in settings. This is the P2 roadmap item currently marked done in `CLAUDE.md`.
- **Fix direction:** Set `"userInterfaceStyle": "automatic"` in `mobile/app.json`. Because this changes generated native config, it requires a rebuild (`npx expo prebuild --clean` then `npm run ios`) — a Metro reload will **not** pick it up, so verify on a fresh build or you will wrongly conclude the fix failed. While here, check that the `_layout.tsx:32` fallback (`?? "dark"`) is what you want; it disagrees with `useAppTheme.ts:65` (`?? "light"`). Make them consistent and note which you picked.
- **Verify:** Confirm `mobile/app.json` still reads `"userInterfaceStyle": "light"`, then confirm the theme plumbing is otherwise correct by reading `_layout.tsx:99-100` and `useAppTheme.ts:63-71`.
- **Test:** Simulator script: **(1)** `npx expo prebuild --clean && npm run ios`, **(2)** in Settings ensure color scheme is "System", **(3)** set the simulator to dark (Features → Toggle Appearance, or Settings → Developer → Dark Appearance), **(4)** confirm the app switches to dark, **(5)** toggle back to light and confirm it follows, **(6)** set the app's own override to "Light" and confirm it stays light while the device is dark, **(7)** same for "Dark" while the device is light.
- **Done when:** All three modes (system / light / dark) behave correctly on a freshly prebuilt binary.

---

# High

## LR-04 — UTC date slice writes lift history under the wrong day

- **Status:** Open
- **Where:** `mobile/hooks/useWorkoutEditor.ts:96-97` — `workout.date?.toDate().toISOString().slice(0, 10)`. Compare `:51` and `mobile/app/(tabs)/workouts/[workoutId].tsx:66`, which both correctly use `formatLocalDate`.
- **What:** `closeHandler` is the only place in the codebase that derives a history date via UTC. Everywhere else uses `formatLocalDate` (`src/core/services/exerciseHistory.ts:35-40`), which reads local `getFullYear/getMonth/getDate`. `exerciseHistory.ts:33` carries a comment warning about this exact hazard, and `exerciseHistory.test.ts:76` has a test asserting the local-time basis. `formatLocalDate` is **already imported** in `useWorkoutEditor.ts:5`.
- **Failure sequence:** A user in UTC-7 finishes an 8pm workout and removes a duplicate exercise from it. `closeHandler` re-schedules the surviving duplicate's history write stamped with tomorrow's date. That lift now lands in the wrong `setsThisWeek` bucket, and — because week bucketing keys off these date strings — can silently shift a set into the following week's stats.
- **Fix direction:** Replace the whole expression at `:96-97` with `formatLocalDate(workout.date?.toDate() ?? new Date())`, exactly matching `:51`. One-line change. Then grep for any other `toISOString` on a user-facing date to confirm this was the only one.
- **Verify:**
  ```bash
  grep -rn "toISOString" src mobile/app mobile/src mobile/hooks mobile/components
  ```
  Confirmed if `mobile/hooks/useWorkoutEditor.ts:97` is the only non-comment, non-test hit.
- **Test:** This is a shared-logic-adjacent bug in mobile code, so no direct Jest coverage is possible. Instead: confirm `src/core/services/exerciseHistory.test.ts` still passes, and add a test there only if you find a genuine gap in `formatLocalDate` coverage (there likely isn't one — `:76` already covers the late-evening rollover). Simulator script: **(1)** set the simulator timezone to a negative UTC offset (e.g. America/Los_Angeles) and the clock to ~10pm, **(2)** open a workout, add the same exercise twice, log a set in each, **(3)** delete one of the duplicates, **(4)** wait 30s or background the app to force the history flush, **(5)** inspect `userStats/{uid}/exercises/{key}` in the Firebase console and confirm the lift's `date` is today's local date, not tomorrow's.
- **Done when:** No UTC-derived date strings remain in write paths, and the simulator check shows the local date.

## LR-05 — Workout list is unbounded and N+1; refetches every card on every focus

- **Status:** Open
- **Where:** `mobile/app/(tabs)/workouts/index.tsx:58-60` (`fetchWorkoutSummaries`), `:62-66` (`useFocusEffect` bumping `refreshKey`) · `mobile/src/components/WorkoutCard.tsx:34-38` (per-card `fetchData` keyed on `refreshKey`) · `src/helperFunctions/FirestoreActions.tsx:89-99` (`fetchWorkoutSummaries`, no `limit`), `:113-140` (`fetchWorkoutsPaginated` — **exists but unused by mobile**).
- **What:** Two compounding problems. (1) `fetchWorkoutSummaries` queries the entire `workouts` collection with `orderBy("date","desc")` and no `limit`; it projects to `{id, date}` client-side, which does **not** reduce the read count or bandwidth. (2) Every rendered `WorkoutCard` then issues its own `fetchData` for the full workout doc, re-firing whenever `refreshKey` changes — and `useFocusEffect` bumps `refreshKey` on **every** focus of the list screen, including each time the user backs out of a workout detail.
- **Failure sequence:** A committed user with 200 workouts opens the list → ~200 doc reads on mount → they tap into a workout, edit a set, hit back → the list refocuses → another full refetch of every mounted card. Firestore billing and cold-start latency grow linearly with a user's training history, i.e. worst for exactly the users you most want to keep. Note `CLAUDE.md` currently claims the mobile list is paginated; it is not.
- **Fix direction:** Two independent halves — both are needed, and they can be separate commits on the one branch.
  1. Switch the list to `FirestoreActions.fetchWorkoutsPaginated` (already implemented and used by web at `src/components/WorkoutTool/WorkoutTool.tsx:42`) with a page size around 20 and `onEndReached` paging on the `SectionList`.
  2. Kill the N+1: `fetchWorkoutsPaginated` already returns each workout's **full** `data`, so `WorkoutCard` should accept the workout as a prop rather than fetching it. That also removes the `refreshKey` mechanism entirely — refresh becomes "re-run the paginated query", not "make every card refetch itself".
  Watch the interaction with `groupIntoSections` (`index.tsx:21-48`): with paging, sections must be recomputed over the accumulated list, not per page.
- **Verify:** Read the cited lines and confirm `fetchWorkoutSummaries` has no `limit` constraint and `WorkoutCard` still fetches per card:
  ```bash
  grep -rn "fetchWorkoutsPaginated\|fetchWorkoutSummaries" src mobile --exclude-dir=node_modules
  ```
- **Test:** Add a Jest test in `src/` only if you change anything in `FirestoreActions` (you likely won't). Simulator script: **(1)** seed an account with 40+ workouts, **(2)** open the workout list and confirm only the first page loads — watch the Firestore read count in the Firebase console usage tab, **(3)** scroll to trigger paging and confirm subsequent pages append correctly and sections stay correct, **(4)** open a workout, edit it, press back, **(5)** confirm the list reflects the edit **and** that the read count did not jump by the full list size.
- **Done when:** Read count on list open is bounded by page size regardless of history length, back-navigation does not trigger a full refetch, and `CLAUDE.md`'s pagination claim is accurate.

## LR-06 — Workout writes fail silently

- **Status:** Open
- **Where:** `mobile/hooks/useWorkoutEditor.ts:41-45` (`saveWorkout` is `async` but never awaited or caught by its four callers: `:50`, `:72`, `:87`, `:116`) · `src/helperFunctions/FirestoreActions.tsx:142-146` (`fetchUserProfile`, no try/catch). Plus ~15 uncaught `.then()` chains across both apps.
- **What:** `saveWorkout` performs the authoritative Firestore write for the workout doc and optimistically calls `setWorkout(updated)` *first*. Every caller invokes it fire-and-forget. If `updateWorkoutById` rejects — offline, permission-denied, quota — the local state already shows the change as saved and the rejection surfaces only as an unhandled promise rejection, which in a release build is silent.
- **Failure sequence:** User logs sets on gym wifi that drops. Each set appears saved. They close the app. Nothing was written. There is no error, no retry, and no indication which sets were lost. This is the highest-consequence failure mode in the app because it destroys the user's actual training log.
- **Fix direction:** Two parts.
  1. Make failure visible: have `saveWorkout` catch, and surface a non-blocking error to the user (a toast/banner is enough; the app has no toast system yet — an `Alert` is acceptable for launch). Consider rolling back the optimistic `setWorkout` on failure, or marking the workout as unsaved.
  2. Make callers await where an ordering guarantee matters — notably `exerciseNameChangeHandler` (`:72`), where `saveWorkout` is followed by `migrateExerciseHistory` (`:74`); if the save fails, the history migration should not proceed.
  Also add a `.catch` to `fetchUserProfile`'s call site (`mobile/app/_layout.tsx:69`) and to the other uncaught chains you touch. Do **not** sweep all 15 chains in this task — fix the workout write path and `_layout.tsx`, and list the rest in the Findings log.
  Consider whether Firestore offline persistence is a better answer than error surfacing; if you think so, say so in the PR rather than implementing it unasked, since it is a much larger change.
- **Verify:**
  ```bash
  grep -rn "\.then(" src mobile/app mobile/src mobile/hooks mobile/components | grep -v catch
  ```
  Read `useWorkoutEditor.ts:41-123` and confirm no caller awaits or catches `saveWorkout`.
- **Test:** Simulator script: **(1)** open a workout and log a set, **(2)** enable Airplane Mode, **(3)** log another set, **(4)** confirm an error is surfaced rather than a silent success, **(5)** disable Airplane Mode and confirm the app recovers to a correct state, **(6)** separately, temporarily deploy a Firestore rule denying writes and confirm permission-denied also surfaces.
- **Done when:** A failed workout write is visible to the user, and `exerciseNameChangeHandler` cannot migrate history after a failed save.

## LR-07 — No ErrorBoundary on mobile

- **Status:** Open
- **Where:** `mobile/app/_layout.tsx` (no boundary anywhere) · compare `src/main.tsx:16-18`, where the web app wraps its tree in `ErrorBoundary` · existing component at `src/components/common/ErrorBoundary.tsx`.
- **What:** Any render-phase throw in the mobile tree unmounts the whole app to a blank screen (dev) or crashes it (release), with no recovery path and no report. Several screens do unguarded work that can throw on malformed data — e.g. `WorkoutCard.tsx:42-50` runs `buildMuscleSummary` on whatever the workout doc contains.
- **Failure sequence:** One malformed workout doc — a legacy shape, a partial write, a missing `date` — throws during render of the list. The user gets a white screen on every launch, permanently, because the bad doc is fetched every time. They cannot reach settings to sign out. Uninstall is their only recovery.
- **Fix direction:** Wrap the mobile tree in an error boundary inside `mobile/app/_layout.tsx` (around `<Slot />`, and ideally also around the pre-auth branch so a `LoginScreen` throw is caught). **Do not reuse `src/components/common/ErrorBoundary.tsx`** — confirmed at audit time that its fallback renders Mantine components and raw `<div>`s (`src/components/common/ErrorBoundary.tsx:52-70`), which cannot render in React Native. Write a small mobile-specific boundary instead; you can copy its `getDerivedStateFromError`/`componentDidCatch`/`handleReset` structure and swap only the fallback UI for RN primitives styled with `useAppTheme()`. The fallback must offer a way out: a "Try again" reset and a sign-out. Note that expo-router also supports an exported `ErrorBoundary` from a route file — either approach is fine, pick one and explain it.
- **Verify:**
  ```bash
  grep -rn "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" mobile/ --exclude-dir=node_modules
  ```
  Confirmed if there are no matches under `mobile/`.
- **Test:** Simulator script: **(1)** temporarily add `throw new Error("boom")` to the render of `mobile/app/(tabs)/index.tsx`, **(2)** confirm the fallback UI appears instead of a blank/crashed screen, **(3)** confirm "Try again" and sign-out both work from the fallback, **(4)** remove the throw and confirm normal rendering resumes. Do not commit the temporary throw.
- **Done when:** A thrown render error shows a recoverable fallback with a working sign-out.

---

# Medium

## LR-08 — `initializeAuth`'s bare catch can silently downgrade to in-memory persistence

- **Status:** Open
- **Where:** `mobile/src/lib/auth.ts:26-34`.
- **What:** **This is not currently broken — verify carefully before changing anything.** The audit initially flagged `getReactNativePersistence` as a runtime blocker and that was wrong. Resolution actually works: `mobile/metro.config.js:20` sets `unstable_enablePackageExports = false`, so Metro uses legacy main fields — `firebase/auth` → `browser` field → `dist/esm/index.esm.js`, which is exactly `export * from '@firebase/auth'` → `@firebase/auth`'s `react-native` field → `dist/rn/index.js`, which **does** export `getReactNativePersistence`. Auth persistence works today. (A plain Node `require` resolves through the `node` condition instead, which is why a naive probe reports it missing — do not "confirm" this finding that way.)
  The real issue is the **bare `catch {}`**: it swallows *every* error, not just the intended already-initialized case, and falls back to `getAuth(app)` with in-memory persistence. The failure is invisible.
- **Failure sequence:** A future `firebase` bump, or flipping `unstable_enablePackageExports` to `true` (which the Expo/Metro ecosystem is moving toward by default), changes resolution → `getReactNativePersistence` is undefined → `initializeAuth` throws `TypeError` → the catch swallows it → **every user is silently signed out on every cold start**, with no error anywhere. Users would experience this as "the app keeps logging me out" and you would have no signal pointing at the cause.
- **Fix direction:** Narrow the catch to the already-initialized case only (check `e.code === "auth/already-initialized"`) and re-throw or at minimum loudly log anything else. Additionally assert `typeof getReactNativePersistence === "function"` before use and fail fast with a clear message. This is a robustness fix — behavior today should be unchanged.
- **Verify:**
  ```bash
  grep -n "unstable_enablePackageExports" mobile/metro.config.js   # expect: false
  grep -c "getReactNativePersistence" node_modules/firebase/node_modules/@firebase/auth/dist/rn/index.js  # expect: >0
  ```
  Read `auth.ts:26-34` and confirm the catch is still unqualified.
- **Test:** `cd mobile && npx tsc --noEmit` (note the `getReactNativePersistence` type error is LR-10's, not yours). Simulator script: **(1)** sign in, **(2)** force-quit the app, **(3)** reopen, **(4)** confirm you are still signed in — this is the behavior the fix must not regress. Then temporarily force the failure (stub the import to `undefined`) and confirm it now surfaces loudly instead of silently.
- **Done when:** A genuine persistence failure is loud, and sign-in still survives a force-quit.

## LR-09 — Previous user's profile bleeds into a newly signed-in account

- **Status:** Open
- **Where:** `mobile/app/_layout.tsx:68-79` — `if (!profile) return;` inside the `fetchUserProfile` `.then`.
- **What:** The effect merges the fetched profile into existing state via `setUserProfile(prev => ({...prev, ...}))`, but returns early when the new account has **no** profile doc. Nothing resets `userProfile` on sign-out or on `userId` change. So the previous user's `weightUnit`, `colorScheme` and `customExercises` persist in context.
- **Failure sequence:** User A (kg, dark, several custom exercises) signs out. User B signs up on the same device — a brand-new account with no profile doc yet. B sees A's unit preference, A's theme, and **A's custom exercise names** in the exercise picker. That last one is a cross-account data disclosure, minor but real, and B's first profile write may persist A's values into B's document.
- **Fix direction:** Reset `userProfile` to its initial value when `userId` changes (or on sign-out in `handleSignOut`, `:92-97`) before the fetch resolves. Replace the early return with an explicit "no profile → use defaults" branch. Watch for the classic async race: a slow fetch for user A can resolve after user B has signed in — guard the `.then` with a check that `userId` is still the one that was requested, or use an abort/generation counter. (`diagnostics-2026-06-12.md` M2 describes this same race.)
- **Verify:** Read `mobile/app/_layout.tsx:68-79` and `:92-97`; confirm no reset exists on `userId` change or sign-out.
- **Test:** Simulator script: **(1)** sign in as user A, set units to kg, theme to dark, create a custom exercise, **(2)** sign out, **(3)** sign up as a brand-new user B, **(4)** confirm B sees lbs, system theme, and **no** custom exercises, **(5)** repeat while throttling the network to try to land A's fetch after B's sign-in, confirming no bleed.
- **Done when:** A new account never observes the prior account's preferences, including under a slow-network race.

## LR-10 — Mobile typecheck fails (5 errors); there is no working type gate

- **Status:** Open
- **What:** `cd mobile && npx tsc --noEmit` reports 5 errors as of 2026-08-17. None is a runtime bug, but together they mean there is no usable typecheck signal before release — real type errors introduced by later tasks would be lost in the noise. Root `npx tsc --noEmit` is clean; only mobile fails.
  1. `app/(tabs)/_layout.tsx:2` — `Cannot find module '@expo/vector-icons'`. Missing types/dep resolution.
  2. `src/components/CustomExercises.tsx:110` — `color` passed as a prop to `TextInput` instead of inside `style`. Harmless at runtime (RN ignores it), but it means the intended color is **not applied** — check whether the input text is actually the wrong color.
  3. `src/components/ExercisePickerModal.tsx:100` — same `color`-as-prop mistake.
  4. `src/lib/auth.ts:3` — `getReactNativePersistence` not exported per the types. Types-only; runtime is fine (see LR-08). Fix by typing around it, not by changing the import's runtime behavior.
  5. `../src/initializeFirebase.tsx:5-10` — `Property 'env' does not exist on type 'ImportMeta'`. The **web** Firebase init is being pulled into mobile's typecheck; mobile actually uses `initializeFirebase.native.ts`. Fix via mobile's `tsconfig.json` (exclude, or add the Vite client types), not by changing the web file.
- **Fix direction:** Work through all five. Items 2 and 3 are genuine (if cosmetic) bugs — move `color` into the `style` object and confirm the resulting color is right against `useAppTheme()` tokens. Item 5 is a tsconfig scoping issue. Do not suppress errors with `@ts-ignore`; if one genuinely cannot be typed, use a narrow, commented `@ts-expect-error`.
- **Verify:** `cd mobile && npx tsc --noEmit` — expect exactly these 5.
- **Test:** `cd mobile && npx tsc --noEmit` exits 0. Root `npm test` and `npx tsc --noEmit` still pass. Simulator script: **(1)** open Settings → Custom Exercises and **(2)** the exercise picker, confirming the text input colors look correct in **both** light and dark mode (this is what items 2–3 actually affect).
- **Done when:** Mobile typecheck is clean and both apps' gates pass. Consider proposing a CI step that runs all three gates — mention it in the PR, don't build it unasked.

## LR-11 — `addNewExercise` key collision

- **Status:** Open
- **Where:** `mobile/hooks/useWorkoutEditor.ts:109-118` — `const key = \`exercise_${Date.now()}\``.
- **What:** Two exercises added within the same millisecond produce the same key, and the second silently overwrites the first in the `ExerciseMap`. `CLAUDE.md` documents that `Workout.exercises` is keyed by **UUID**; this generator does not produce one, so the data model and the code disagree.
- **Failure sequence:** Realistically rare from taps, but reachable via double-fire on the "+ Add Exercise" button (`[workoutId].tsx:53`) or any future bulk/template add. Result is a silently dropped exercise.
- **Fix direction:** Generate a real UUID. Confirmed at audit time: **no UUID helper or library exists anywhere in the repo**, and neither `expo-crypto` nor `uuid` is a dependency in either `package.json` — so this requires either adding a dependency or writing a small generator. `crypto.randomUUID` is not reliably available in the RN Hermes runtime; do not rely on it without verifying. Prefer `expo-crypto` (`npx expo install expo-crypto` from `mobile/`, which picks an SDK-compatible version) since Expo is already the toolchain. Put the helper in shared `src/` so the web app can use the same one. Also consider guarding the add button (`[workoutId].tsx:53`) against double-fire.
- **Verify:** Read `:109-118`; grep for how other exercise keys are generated:
  ```bash
  grep -rn "randomUUID\|uuid\|exercise_" src mobile/app mobile/src mobile/hooks mobile/components
  ```
- **Test:** If you add a key-generation helper to shared `src/`, unit-test it there (uniqueness across a tight loop). Simulator script: **(1)** open a workout, **(2)** tap "+ Add Exercise" rapidly 5 times, **(3)** confirm 5 distinct exercise cards appear and all 5 persist after a reload.
- **Done when:** Keys are collision-free and consistent with the documented UUID model.

## LR-12 — `users/demoUser` is writable by any authenticated user

- **Status:** Open
- **Where:** `firestore.rules` — the `users/demoUser/{document=**}` and `userStats/demoUser/{document=**}` blocks, `allow read, write: if request.auth != null`.
- **What:** Intentional per the inline comment (the sandbox is reset by `updateDemoData()`), and currently load-bearing for the web app's anonymous-auth demo path (`src/App.tsx`). But it means any authenticated user — including any anonymous session, i.e. anyone who can open the web app — can write arbitrary data into the shared demo account that every other demo user then sees.
- **Failure sequence:** Someone writes abusive or garbage content into the demo sandbox; it is then displayed to every prospective user who taps "try the demo", and to App Store reviewers. Low likelihood, high embarrassment, trivially exploitable by anyone who reads the client bundle.
- **Fix direction:** **Do LR-02 first** — its resolution may make this moot. If demo mode moves to per-user anonymous sandboxes, delete these rule blocks entirely. If shared demo data is kept, make the sandbox **read-only** to clients (`allow read: if request.auth != null; allow write: if false`) and move `updateDemoData()`'s date-shuffling server-side (a scheduled Cloud Function) — but note that read-only demo data means demo users cannot log a workout, which changes what the demo can show. Raise the tradeoff with the human rather than deciding alone.
  Any rules change must be validated and deployed: `firebase deploy --only firestore:rules`. Confirm the web app (`src/App.tsx`) still works afterward — the anon-auth path there is a documented launch-blocker invariant in `CLAUDE.md`.
- **Verify:** Read `firestore.rules` and confirm the two `demoUser` blocks still grant write to any authenticated session.
- **Test:** Use the Firestore rules emulator/simulator to assert: an anonymous session **cannot** write `users/demoUser/...` under the new rules, a signed-in user can still read it, and a user can still read/write their own `users/{uid}/...`. Then, after deploying, the human should confirm both the web demo and the mobile demo still function.
- **Done when:** The demo sandbox is not arbitrarily writable, both demo paths still work, and rules are deployed.

---

## Findings log

Append one line per event. Newest last.

| Date | Task | Event |
|---|---|---|
| 2026-08-17 | — | Audit performed against `main` @ `00014db`. 12 findings filed. |
| 2026-08-17 | LR-01 | Verified, fixed (inlined 6 Firebase env vars into `eas.json` preview/production profiles), root gates pass, PR #1 opened. Manual EAS cloud-build verification still pending (human required). |
| 2026-08-17 | LR-01 | Deferred: human is purchasing an Apple Developer Program account before running the signed cloud build needed for final verification. PR #1 left open/unmerged in the meantime. Session cleared here; next session starts LR-03. |
| 2026-08-17 | LR-03 | Verified, fixed (`userInterfaceStyle: "automatic"` in `app.json`; unified `useColorScheme()` fallback to `"dark"` in both `_layout.tsx` and `useAppTheme.ts`). Confirmed via `expo prebuild --clean` that `Info.plist` now reads `UIUserInterfaceStyle: Automatic`. All gates pass (mobile `tsc` shows only the pre-existing LR-10 errors). PR #2 opened. Human ran the simulator test on a freshly prebuilt binary: manual light/dark override in settings correctly overrides system, and "system" option correctly follows device appearance. Ready to merge. |
| 2026-08-17 | LR-10 | Verified all 5 errors reproduced. Fixed: `moduleSuffixes` in `mobile/tsconfig.json` so `tsc` resolves `@shared/initializeFirebase` to the `.native.ts` variant (was wrongly checking the web `.tsx` file); un-ignored/committed `mobile/expo-env.d.ts` so that fix's `process.env` typing works from a clean checkout; added missing `@expo/vector-icons` dependency (hoists to single root copy); removed two redundant/invalid `color` props on `TextInput`s (no-op, `style.color` already set the same value); added a narrow `firebase/auth` module augmentation for `getReactNativePersistence` typing (no runtime change, see LR-08). Root `tsc`/`test`/`lint` and mobile `tsc` all pass — 0 errors, down from 5. PR #3 opened. Simulator script included in PR body for the human to eyeball the two TextInput color claims (expected no visible change). |
| 2026-08-17 | LR-10 | Follow-up commit — review pass found **three further bugs** caused by the fixes above. **(1)** Adding `@expo/vector-icons` made npm resolve its `expo-font` peer (`>=14.0.4`) to `expo-font@57.0.1` nested under `@expo/vector-icons/node_modules`, a second copy alongside the `expo-font@14.0.12` that `expo` depends on. `pod install` autolinked against the wrong tree and the Release iOS build crashed at launch with `Error: Cannot find native module 'ExpoFontLoader'`. Fixed with `"expo-font": "~14.0.12"` in the **root** `package.json` `overrides` (verified in an isolated workspace repro that npm ignores `overrides` declared in a workspace's own `package.json` — the copy in `mobile/package.json` is documentation only, matching the pre-existing `react-native-screens` pattern, and has no effect). `npm ls expo-font` now shows one deduped `14.0.12`; `@expo/vector-icons` and `expo-modules-core` also converge on single copies. **⚠️ STILL NEEDS HUMAN VERIFICATION on a real simulator** — re-run `npx expo prebuild --clean && pod install && npx expo run:ios --configuration Release` and confirm the `ExpoFontLoader` crash is gone. This was not verifiable in-agent. **(2)** Committing `mobile/expo-env.d.ts` was actively unsafe: `@expo/cli`'s `startTypescriptTypeGeneration` **force-deletes `<projectRoot>/expo-env.d.ts`** on every `expo start`/`expo run:ios` unless `experiments.typedRoutes: true` is set in `app.json` (it is not), so the committed file would be wiped the first time anyone ran the app, silently regressing the gate. Fixed by deleting the tracked file, re-ignoring it in `mobile/.gitignore` (**anchored as `/expo-env.d.ts`** — an unanchored pattern also matched, and silently git-ignored, the replacement file), and putting `/// <reference types="expo/types" />` in `mobile/src/types/expo-env.d.ts`, a filename Expo's CLI does not manage. **(3)** Moving that reference into a subdirectory changed declaration-file ordering and surfaced a latent conflict: `expo/types/global.d.ts` does `/// <reference types="node" />`, so `setTimeout` has both the @types/node overload (`NodeJS.Timeout`) and React Native's (`number`), and which one wins depends on program file order. `mobile/hooks/useExerciseHistoryWriter.ts:18` declared `timerId: number` and began failing. Fixed to `ReturnType<typeof setTimeout>`, which is correct under either ordering; it was the only such site in the tree. All four gates re-verified green after the follow-up: root `tsc` 0 errors, `npm test` 65/65, root `npm run lint` 0 warnings, mobile `tsc` 0 errors. Lockfile confirmed in sync with `package.json`. |
| 2026-08-17 | LR-10 | Human ran `npx expo prebuild --clean && pod install && npx expo run:ios --configuration Release` on a real simulator: launches successfully, `ExpoFontLoader` crash confirmed gone. |
| 2026-08-17 | LR-10 | `/code-review high` pass found 3 more findings, all fixed in a third commit: (1) `moduleSuffixes` only covered `.native`, not `.ios` — a future `Foo.ios.tsx` platform split would've silently diverged between what Metro bundles and what `tsc` checks; added `.ios` (no `.android`, not wired yet). (2) `expo-font`'s pin was override-only with no explicit dependency — a future Expo SDK bump could silently force a stale `expo-font` underneath `expo`'s own code instead of surfacing as a conflict; added it as an explicit `mobile/package.json` dependency too (mirrors the `react-native-screens` precedent). (3) `firebase-auth-rn.d.ts`'s comment cited the untracked `docs/launch-readiness-2026-08-17.md` — reworded to explain the runtime resolution path inline instead. All four gates re-verified green. |
| 2026-08-17 | LR-10 | PR #3 squash-merged into `main` (`0428d1d`), branch deleted. Task complete. |
| 2026-11-22 | LR-03 | `/code-review` of PR #2 found that switching to `"automatic"` lets native chrome follow the device instead of the in-app override. Fixed on the PR: `expo-status-bar` `<StatusBar>` driven by `resolvedColorScheme` in `mobile/app/_layout.tsx` (status bar text could be invisible), and `keyboardAppearance={useAppScheme()}` on all 6 TextInputs. Merged `main` into the branch first (picks up LR-10). All four gates pass. Human waived a fresh simulator run for this minor follow-up. Squash-merged. Remaining review findings logged in Out-of-scope notes. |

## Out-of-scope notes

Things noticed during the audit that are **not** tasks. Add to this list rather than fixing opportunistically.

- **(from LR-03 review, 2026-11-22) Dark/light flash on cold start.** `userProfile` starts as `colorScheme: "system"` in `mobile/app/_layout.tsx` until `fetchUserProfile` resolves, so a user who chose an override whose value differs from the device briefly sees the device scheme. Fix needs a decision: cache the last `colorScheme` locally (e.g. AsyncStorage) or keep themed UI hidden until the profile loads. Candidate for a new LR task.
- **(from LR-03 review) `Alert.alert` dialogs follow the device appearance**, not the in-app override. They can't be themed per app on iOS, so accept this unless you override at the native level.
- **(from LR-03 review) White splash and loading screen in dark mode.** `mobile/app.json` splash `backgroundColor` is fixed at `#ffffff` with no `dark` variant, and the auth-check spinner `View` in `_layout.tsx` has no background color.
- **(from LR-03 review) Android:** `userInterfaceStyle` needs `expo-system-ui`, which is not installed. Pick this up when Android is wired, and run the workspace dedup checks when you add it.

- ~15 uncaught `.then()` chains remain across both apps beyond the ones LR-06 addresses. Candidate for a follow-up sweep.
- `CLAUDE.md` claims the mobile workout list is paginated (it is not — LR-05) and that the P2 dark-mode item is done (it is not — LR-03). Update the doc as part of those tasks.
- `src/helperFunctions/FirestoreActions.tsx:221-240` (`migrateExerciseHistory`) concatenates both docs' `allLifts` with no dedupe by `workoutId`. No concrete failure path found, but it is fragile if a key is ever migrated twice.
- The exercise-rename history flow is still marked "needs manual testing" in `CLAUDE.md`; the checklist there is untouched by this audit.
