# Diagnostic Audit — 2026-06-12

**Scope:** mobile app (`mobile/`) + shared `src/` code it consumes. Web-only UI out of scope.
**Method:** static code review only (no tests written, no code changed, no app runs).
**Severity guide:** Critical = silent data loss/breakage in normal use · High = data loss/corruption in plausible edge cases · Medium = state divergence with user-visible wrongness · Low = correctness smell, no clear path to user harm.
**Confidence:** every finding is *confirmed by reading the cited code* unless marked **suspected**.

**Known items (acknowledged, not audited):**
- `firestore.rules` dev catch-all `allow read, write: if request.time < timestamp.date(2026, 8, 31)` — intentional pre-launch. (But see **C1**, which makes this rule load-bearing.)
- Web app is out of scope. Two web-only notes for the record: it has no `onAuthStateChanged` listener (Redux resets to `demoUser` on page reload), and `getMondayDate()`'s Sunday bug (see M-7) affects web `MuscleDiagram`.

---

## Critical

### C1 — Mobile Firestore traffic is unauthenticated; the app only works because of the temp rule
- **Where:** `mobile/src/lib/auth.ts:24-39` (auth on mobile's own `firebase@10.14.1`), `src/initializeFirebase.native.ts:13-14` (Firestore on root `firebase@10.7.2`), `src/helperFunctions/FirestoreActions.tsx:19` (all CRUD uses the root instance). Verified: both package copies exist on disk at different versions.
- **What:** Auth and Firestore are initialized on **two separate Firebase SDK instances** (the comment in `auth.ts` documents this was done deliberately to dodge a "Component auth has not been registered yet" error). The Firestore app has no auth component, so every request goes out with `request.auth == null`. The per-user rule in `firestore.rules` never matches; the only thing allowing any read/write is the dev catch-all.
- **Failure sequence:** On 2026-08-31 the temp rule expires → **every Firestore call from the mobile app is denied** → app is fully broken (no workouts, no profile, no history). Equally important: security rules cannot be tightened per-user until this is fixed, because no request ever carries a uid.
- **Fix direction:** single `firebase` dependency/version resolved once (e.g., force Metro to resolve `firebase` to one copy, or move Firebase init fully into `mobile/` and inject `db`), then `initializeAuth` and `initializeFirestore` on the same `FirebaseApp`.

### C2 — Editing one of two same-day workouts erases the other's history lifts
- **Where:** `src/core/services/exerciseHistory.ts:93-100` (`mergeLifts` drops **all** stored lifts where `date === workoutDateStr`), `mobile/hooks/useExerciseHistoryWriter.ts:31-47` (session lifts are computed only from the currently open workout's `ExerciseMap`).
- **What:** `mergeLifts` assumes one workout per date. The replacement set is built from the open workout only, so lifts logged in another workout on the same date (for the same exercise key) are removed from `allLifts` on the next debounced write.
- **Failure sequence:** Morning workout: bench press 5 sets (written to history). Evening workout same day: add bench press, log 1 set → 30s later the history write replaces all of today's bench lifts with just that 1 set. The morning 5 sets are gone from `userStats` silently. Same applies to editing yesterday's second workout, etc.
- **Fix direction:** scope replacement to the workout (tag lifts with `workoutId`), or have the writer aggregate session sets across all same-day workouts before merging.

---

## High

### H1 — Pending history writes are fired-and-forgotten on background/unmount; force-quit loses sets
- **Where:** `mobile/hooks/useExerciseHistoryWriter.ts:113-121` (`flushAll` is `forEach(async ...)` — nothing awaits the writes), `:124-135` (AppState listener and unmount cleanup call it without awaiting), 30s debounce at `:78-81`.
- **What:** Each flush is a fetch → merge → `setDoc` roundtrip started but never awaited. On backgrounding, iOS may suspend the JS thread before the roundtrip completes; on force-quit within the 30s debounce window the timer never fires at all. The error path (`console.error` at `:57-58`) is silent to the user.
- **Failure sequence:** User logs sets, immediately swipes the app away (common end-of-workout behavior) → history doc never updated → stats (max, sets this week) silently wrong forever after. The workout doc itself is safe (written synchronously per edit), only `userStats` diverges.
- **Fix direction:** `Promise.all` the flushes and await where possible; consider writing history in the same path as the workout save instead of debouncing, or reconciling history from workout docs on read.

### H2 — New users' preference writes throw: `updateDoc` on a document that doesn't exist
- **Where:** `src/helperFunctions/FirestoreActions.tsx:148-151` (`updateUserProfile` uses `updateDoc`), `:162-168` (`updateFavoriteExercises` same). Callers fire-and-forget: `mobile/src/components/UserPreferences.tsx:29,35`. No code anywhere creates `users/{uid}/preferences/userProfile` at sign-up (`LoginScreen.tsx` only calls Firebase auth).
- **What:** `updateDoc` fails with `not-found` when the doc is missing. For a brand-new account the profile doc doesn't exist until `updateCustomExercises` (which correctly uses `setDoc(..., {merge: true})`, `:177`) happens to run first.
- **Failure sequence:** New user signs up → Settings → switches to kg → UI flips (optimistic context update) but the write rejects unhandled → on next app launch they're back to lbs. Repeats until they happen to create a custom exercise.
- **Fix direction:** use `setDoc(..., { merge: true })` in `updateUserProfile`/`updateFavoriteExercises`, or create the profile doc on first login.

### H3 — Deleting a workout/exercise removes history lifts from the *wrong dates*
- **Where:** `src/core/services/exerciseHistory.ts:77-90` (`removeMatchingLifts` matches on `weight`+`reps` only — `date` is ignored), callers: `FirestoreActions.tsx:50-67` (`deleteWorkoutWithHistory`), `:202-221`, `mobile/hooks/useWorkoutEditor.ts:77-106` (`closeHandler`).
- **What:** Removal consumes the first array entry matching the weight/reps signature regardless of date. Lifters repeat the same weight×reps constantly, so cross-date mismatches are the norm, not the edge.
- **Failure sequence:** User benches 100kg×5 every week. They delete a 3-week-old workout → the matcher may consume *this week's* 100kg×5 lifts instead → `setsThisWeek` and date-based stats are now wrong, and the 3-week-old lifts remain.
- **Fix direction:** pass the workout's date into removal and match `weight+reps+date` (both callers already know the workout doc, which contains the date).

---

## Medium

### M1 — `updateDemoData()` runs on every app launch, for every user
- **Where:** `mobile/app/_layout.tsx:58-62`; implementation `FirestoreActions.tsx:242-273`.
- **What:** Redux `auth.userId` initializes to `"demoUser"` (`src/features/auth/authSlice.ts:6`), so this effect fires on first render — before the auth listener resolves — on every cold start, including for logged-in users. It rewrites all `users/demoUser` workout dates with random dates (unauthenticated write, see C1; fire-and-forget `forEach(async ...)`). Bonus bug: `timestampsFromLastWeek.splice(Math.floor(Math.random() * 7), 1)[0]` indexes a shrinking array with a fixed 0-6 random index, so some workouts get `date: undefined` → silently replaced with `Timestamp.now()` by `updateWorkoutById`.
- **Fix direction:** gate on an explicit demo-mode flag (not the sentinel userId) and/or run it once when demo mode is actually entered.

### M2 — Profile fetch race on launch and account switch
- **Where:** `mobile/app/_layout.tsx:64-75`.
- **What:** The effect runs with `userId = "demoUser"` on mount, then again when the real uid lands. Two `fetchUserProfile` promises are in flight with no stale-response guard; whichever resolves last wins. **Suspected** in practice (ordering usually favors the later request, but nothing enforces it).
- **Failure sequence:** Launch → demo profile resolves after the real profile → user sees demo weight unit/color scheme/custom exercises until next launch.
- **Fix direction:** standard cancelled-flag cleanup in the effect, and skip fetching for the sentinel `"demoUser"` unless demo mode is active.

### M3 — Sign-out doesn't clear session state; pending history flush can land under the wrong user
- **Where:** `mobile/app/_layout.tsx:88-93` (`handleSignOut` only flips demo flag and calls Firebase signOut), `mobile/hooks/useExerciseHistoryWriter.ts:13-20` (`userIdRef` re-snapshots on every render), `:130-134` (unmount flush).
- **What:** Two issues. (a) `userProfile` state is not reset on sign-out; if the next account's profile doc is missing, `if (!profile) return` (`_layout.tsx:66`) leaves user A's profile (incl. custom exercises) visible to user B. (b) If sets were edited <30s before sign-out, the editor's unmount flush runs after Redux flips to `"demoUser"`; whether `userIdRef` has already re-snapshotted determines whether the lifts are written to `userStats/demoUser`. **Suspected** (depends on React render/unmount ordering).
- **Fix direction:** on `logOutUser`, reset `userProfile` to defaults and cancel (not flush) pending history timers, or capture the uid at schedule time instead of a live ref.

### M4 — Renaming a custom exercise forks its history
- **Where:** `mobile/src/components/CustomExercises.tsx:33-46` (`saveRename` updates only the profile doc), history keys derived from the name via `normalizeExerciseKey` (`useExerciseHistoryWriter.ts:70`).
- **What:** After a rename, new sessions log under the new normalized key; old history stays under the old key; nothing calls `migrateExerciseHistory` (which exists and handles exactly this for in-workout renames, `FirestoreActions.tsx:222-241`). Old workout docs also keep the stale `variant`, so their cards/drawers show the old name.
- **Fix direction:** call `migrateExerciseHistory` from `saveRename` (and decide whether to rewrite `variant` in past workout docs).

### M5 — Drawer stats don't include the current session (contradicts CLAUDE.md)
- **Where:** `mobile/components/ExerciseEditDrawer.tsx:72-81` — fetches history and runs `computeStats(doc.allLifts)` directly.
- **What:** CLAUDE.md states "Mid-workout history read merges Firestore `allLifts` with current in-memory session sets client-side before computing stats." No such merge exists. With the 30s debounce, "This week" / "Max" exclude everything logged in the last 30s — and everything in the session if the debounced write hasn't fired. Either the feature regressed or was never wired; either way the doc is wrong.
- **Fix direction:** merge `exercise.sets` (and same-key session sets) into the fetched lifts before `computeStats`, mirroring what `updateFirestore` does.

### M6 — Optimistic, non-transactional workout delete with no error handling
- **Where:** `mobile/app/(tabs)/workouts/index.tsx:79-82`; cascade in `FirestoreActions.tsx:50-67`.
- **What:** UI removes the row immediately; the cascade (fetch workout → N history rewrites → delete doc) is fire-and-forget and not atomic. A mid-cascade failure leaves history partially rewritten and/or the workout doc still present, with no user feedback and no rollback.
- **Fix direction:** await + surface errors and restore the row on failure; batch the deletes (`writeBatch`) where possible.

### M7 — Stale module-scope `today` in DateHelper skews the dashboard window
- **Where:** `src/helperFunctions/DateHelper.tsx:1` (`const today = new Date()` evaluated at module load), consumed by mobile `WeeklySummary.tsx:57` via `getByDaysElapsed(7)`.
- **What:** RN JS contexts survive backgrounding for days, so the "last 7 days" fetch window silently widens (7 + N days since launch) — the dashboard overcounts sets. Same stale `today` powers `getMondayDate()`, which additionally computes `getDay() - 1` and on **Sundays returns tomorrow** (web-only consumer; the mobile/list/history code uses the correct `(getDay()+6)%7` form).
- **Fix direction:** compute `new Date()` inside each function; delete or fix `getMondayDate` in favor of the shared `getCurrentWeekMonday`.

### M8 — Workout doc shape vs. `Workout` type: exercises live at the top level
- **Where:** writes spread exercises beside `date` (`useWorkoutEditor.ts:48,71,116`), reads filter `k !== "date"` (`useWorkoutEditor.ts:15-24`, `FirestoreActions.tsx:53`, `muscleCalculations.ts:57`). Type says `Workout.exercises?: ExerciseMap` (`src/types.ts:17-22`) — that field is never used at runtime; CLAUDE.md repeats the wrong shape.
- **What:** Any future scalar/object field added to the doc gets treated as an exercise by `workoutToExerciseMap` (no `typeof` guard, unlike `buildMuscleSummary:58`). The already-typed `durationSeconds` field — displayed by `WorkoutCard.tsx:52` — would render a phantom exercise row in the editor the day something writes it.
- **Fix direction:** either migrate docs to a real `exercises` sub-map or fix the type + add a guard in `workoutToExerciseMap`; update CLAUDE.md.

### M9 — Lost edits from stale closures on rapid successive saves
- **Where:** `mobile/hooks/useWorkoutEditor.ts:39-52,120-123` — `onSetsChange`/`onDateChange` build the next doc from the `workout` closure and `setDoc` the full doc.
- **What:** Two state updates in the same tick (before a re-render) each spread the *old* `workout`, so the second full-doc write silently drops the first change. Firestore writes from one client apply in order, so the stale one wins. **Suspected** — current UI (one drawer, per-tap events) makes same-tick collisions rare, but nothing structural prevents them.
- **Fix direction:** functional `setWorkout(prev => ...)` and write from the updated value, or queue saves.

---

## Low

- **L1 — Three different "week" semantics.** Dashboard = rolling 7 days labeled "This Week" (`WeeklySummary.tsx:57`); workout list sections = Monday-anchored (`workouts/index.tsx:22-49`); history `setsThisWeek` = Monday-anchored with **no upper bound**, so future-dated lifts count (`exerciseHistory.ts:57`). Product-level inconsistency rather than a bug.
- **L2 — Type bugs in `src/types.ts`.** `exerciseHistory?: [ExerciseHistory]` and `favoriteExercises?: [string]` are single-element *tuples*, not arrays (`types.ts:75-76`); `ExerciseHistory` (`types.ts:89-98`) is a dead legacy schema.
- **L3 — Dead/unused code.** `mobile/components/ExerciseHistorySheet.tsx` is never imported anywhere, though CLAUDE.md documents it as a shipped feature. Mobile never uses the `exercises` Redux slice/favorites (the "dual-write divergence" risk is web-only today).
- **L4 — Picker drops `customExerciseId` for existing custom exercises.** `ExercisePickerModal.tsx:118` calls `handleSelect(item, item)` without the id; muscle attribution then relies on the name-scan fallback (`muscleCalculations.ts:74-79`), which breaks if the custom exercise is later renamed (compounds M4).
- **L5 — Auth UX.** Raw Firebase error strings shown to users (`LoginScreen.tsx:41-44`); no password-reset flow exists.
- **L6 — Workout list staleness + N+1 reads.** The list fetches summaries only on `userId` change (`workouts/index.tsx:59-61`); focus only bumps `refreshKey`, so each `WorkoutCard` refetches its full doc (N+1) while section placement/order still uses the stale summary dates — edit a workout's date and it stays in the wrong section until remount.
- **L7 — In-place state mutation.** `exerciseNameChangeHandler` does `delete updated[key].customExerciseId` on an object still referenced by current state (`useWorkoutEditor.ts:69`).

---

## Prioritized fix list

1. **C1 — unify the Firebase SDK instance** (one `firebase` copy, auth + Firestore on the same app). Hard deadline in effect: the app dies 2026-08-31 otherwise, and no security-rule tightening is possible before this. Everything auth-related (M1, M3) is easier after.
2. **C2 — fix `mergeLifts` same-date semantics** (tag lifts with `workoutId` or aggregate same-day workouts). Silent data loss in routine use.
3. **H2 — `setDoc(..., {merge:true})` for profile writes** (one-line class of fix; every new user hits it).
4. **H1 — await/synchronize history flushes** (and consider dropping the debounce in favor of writing alongside the workout save — would also fix M5 and shrink C2's window).
5. **H3 — match removal by date** in `removeMatchingLifts` callers.
6. **M1/M2/M3 — auth/session hygiene bundle**: explicit demo-mode flag, stale-fetch guard, state reset + timer cancellation on sign-out.
7. **M4 + L4 — custom-exercise rename migration** and id-preserving selection.
8. **M6, M7, M8, M9** as a persistence-hardening pass.
9. **Lows** opportunistically; update CLAUDE.md where it contradicts the code (M5, M8, L3).

## Suggested verification once fixes land

- Unit tests: `mergeLifts` with two same-day workouts; `removeMatchingLifts` with date matching; `getByDaysElapsed` across a mocked midnight; tuple-type fixes compile-checked by `npm run build`.
- Manual: new-account signup → toggle weight unit → relaunch (H2); log sets → force-quit within 30s → check `userStats` (H1); rules emulator check that requests carry `request.auth` after C1 (`firebase emulators` or a temporary rules tightening in a test project).
