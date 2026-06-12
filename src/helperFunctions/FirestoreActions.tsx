import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import db from "../initializeFirebase";
import { UserProfile, Workout, WorkoutEntry } from "../types";
import type { ExerciseHistoryDoc } from "../core/services/exerciseHistory";
import { computeStats, normalizeExerciseKey, removeWorkoutLifts } from "../core/services/exerciseHistory";

export type WorkoutPageCursor = QueryDocumentSnapshot<DocumentData> | null;

export const FirestoreActions = {
  createWorkout: (userId: string) => {
    const newWorkoutDoc = doc(collection(db, "users", userId, "workouts"));
    return newWorkoutDoc;
  },
  // Might need to throw this out in the case where I only upload specific
  // entires as they change instead of amending the whole user file?
  // maybe it's managable by using the {merge: true} option
  updateWorkoutById: async (
    userId: string,
    workoutId: string,
    document: Workout,
  ) => {
    const docRef = doc(db, "users", userId, "workouts", workoutId);
    const safeDocument = {
      ...document,
      date: document.date ?? Timestamp.fromDate(new Date()),
    };
    await setDoc(docRef, safeDocument);
  },
  deleteWorkoutById: async (userId: string, workoutId: string) => {
    const docRef = doc(db, "users", userId, "workouts", workoutId);
    await deleteDoc(docRef);
  },
  deleteWorkoutWithHistory: async (userId: string, workoutId: string) => {
    const workout = await FirestoreActions.fetchData(userId, workoutId);
    if (workout) {
      const firestoreKeys = new Set(
        Object.entries(workout)
          .filter(([k]) => k !== "date")
          .map(([, ex]) =>
            normalizeExerciseKey((ex as { variant?: string }).variant ?? ""),
          )
          .filter((key) => key !== ""),
      );
      await Promise.all(
        [...firestoreKeys].map((firestoreKey) =>
          FirestoreActions.removeWorkoutLiftsFromHistory(userId, firestoreKey, workoutId),
        ),
      );
    }
    await FirestoreActions.deleteWorkoutById(userId, workoutId);
  },
  fetchData: async (userId: string, workoutId: string) => {
    const docRef = doc(db, "users", userId, "workouts", workoutId);
    // First check if data exists. It will not exist in the case that a new user logs in.
    const data = await getDoc(docRef);
    if (data.exists()) {
      return data.data();
    } else {
      console.log("FirestoreActions.fetchData: Document does not exist");
      console.log(
        `FirestoreActions.fetchData: userId:${userId}, workoutId:${workoutId}`,
      );
    }
  },
  fetchWorkoutIds: async (userId: string) => {
    const workoutsQuery = query(
      collection(db, "users", userId, "workouts"),
      orderBy("date", "desc"),
    );
    const querySnapshot = await getDocs(workoutsQuery);
    return querySnapshot.docs.map((docSnapshot) => docSnapshot.id);
  },
  fetchWorkoutSummaries: async (userId: string): Promise<{ id: string; date: Timestamp }[]> => {
    const workoutsQuery = query(
      collection(db, "users", userId, "workouts"),
      orderBy("date", "desc"),
    );
    const querySnapshot = await getDocs(workoutsQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.data().date as Timestamp,
    }));
  },
  fetchWorkoutsAfterDate: async (userId: string, date: Date) => {
    const dateTimestamp = Timestamp.fromDate(date);
    const workoutsQuery = query(
      collection(db, "users", userId, "workouts"),
      where("date", ">=", dateTimestamp),
      orderBy("date", "asc"),
    );
    const querySnapshot = await getDocs(workoutsQuery);
    return querySnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      data: snapshot.data() as Workout,
    }));
  },
  fetchWorkoutsPaginated: async (
    userId: string,
    pageSize: number,
    cursor?: WorkoutPageCursor,
  ) => {
    const constraints: QueryConstraint[] = [orderBy("date", "desc")];
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(pageSize + 1));

    const workoutsQuery = query(
      collection(db, "users", userId, "workouts"),
      ...constraints,
    );
    const querySnapshot = await getDocs(workoutsQuery);
    const hasMore = querySnapshot.docs.length > pageSize;
    const docs = hasMore
      ? querySnapshot.docs.slice(0, pageSize)
      : querySnapshot.docs;

    const workouts: WorkoutEntry[] = docs.map((docSnap) => ({
      id: docSnap.id,
      data: docSnap.data() as Workout,
    }));
    const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

    return { workouts, cursor: lastDoc, hasMore };
  },
  fetchUserProfile: async (userId: string) => {
    const userProfile = await getDoc(
      doc(db, "users", userId, "preferences", "userProfile"),
    );
    return userProfile.data();
  },
  updateUserProfile: async (userId: string, userProfile: UserProfile) => {
    const docRef = doc(db, "users", userId, "preferences", "userProfile");
    await updateDoc(docRef, { ...userProfile });
  },
  fetchFavoriteExercises: async (userId: string) => {
    const userProfile = await getDoc(
      doc(db, "users", userId, "preferences", "userProfile"),
    );
    if (userProfile.data() === undefined) {
      return [];
    } else {
      return userProfile.data()!.favoriteExercises;
    }
  },
  updateFavoriteExercises: async (
    userId: string,
    favoriteExercises: string[],
  ) => {
    const docRef = doc(db, "users", userId, "preferences", "userProfile");
    await updateDoc(docRef, { favoriteExercises: favoriteExercises });
  },
  updateCustomExercises: async (
    userId: string,
    customExercises: Record<
      string,
      { name: string; muscleGroup: string | null }
    >,
  ) => {
    const docRef = doc(db, "users", userId, "preferences", "userProfile");
    await setDoc(docRef, { customExercises }, { merge: true });
  },
  fetchExerciseHistory: async (
    userId: string,
    exerciseKey: string,
  ): Promise<ExerciseHistoryDoc | null> => {
    const docRef = doc(db, "userStats", userId, "exercises", exerciseKey);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as ExerciseHistoryDoc) : null;
  },
  upsertExerciseHistory: async (
    userId: string,
    exerciseKey: string,
    document: ExerciseHistoryDoc,
  ): Promise<void> => {
    const docRef = doc(db, "userStats", userId, "exercises", exerciseKey);
    return await setDoc(docRef, document);
  },
  deleteExerciseHistory: async (
    userId: string,
    exerciseKey: string,
  ): Promise<void> => {
    const docRef = doc(db, "userStats", userId, "exercises", exerciseKey);
    await deleteDoc(docRef);
  },
  removeWorkoutLiftsFromHistory: async (
    userId: string,
    exerciseKey: string,
    workoutId: string,
  ): Promise<void> => {
    const existing = await FirestoreActions.fetchExerciseHistory(userId, exerciseKey);
    if (!existing) return;
    const remaining = removeWorkoutLifts(existing.allLifts, workoutId);
    if (remaining.length === existing.allLifts.length) return;
    if (remaining.length === 0) {
      await FirestoreActions.deleteExerciseHistory(userId, exerciseKey);
    } else {
      await FirestoreActions.upsertExerciseHistory(userId, exerciseKey, {
        ...existing,
        allLifts: remaining,
        computed: computeStats(remaining),
      });
    }
  },
  migrateExerciseHistory: async (
    userId: string,
    oldKey: string,
    newKey: string,
    newExerciseName: string,
  ): Promise<void> => {
    const [oldDoc, newDoc] = await Promise.all([
      FirestoreActions.fetchExerciseHistory(userId, oldKey),
      FirestoreActions.fetchExerciseHistory(userId, newKey),
    ]);
    if (!oldDoc) return;
    const mergedLifts = [...oldDoc.allLifts, ...(newDoc?.allLifts ?? [])];
    const merged: ExerciseHistoryDoc = {
      exerciseName: newExerciseName,
      allLifts: mergedLifts,
      computed: computeStats(mergedLifts),
    };
    await FirestoreActions.upsertExerciseHistory(userId, newKey, merged);
    await FirestoreActions.deleteExerciseHistory(userId, oldKey);
  },
  updateDemoData: async () => {
    // This is a function to update the demo data in the database
    // to demonstrate the functionality of the muscle summary
    const userId = "demoUser";
    // Fetch all workouts of demoUser
    await FirestoreActions.fetchWorkoutIds(userId).then((workoutIds) => {
      // Randomly choose dates within the last 7 days for each workout
      const timestampsFromLastWeek: Timestamp[] = [];
      [1, 2, 3, 4, 5, 6, 7].forEach((day) => {
        const date = new Date();
        date.setDate(date.getDate() - day);
        timestampsFromLastWeek.push(Timestamp.fromDate(date));
      });

      workoutIds.forEach(async (workoutId) => {
        // Replace each workout with a new workout with a date from the last week
        const workout = await FirestoreActions.fetchData(userId, workoutId);
        const updatedWorkout = {
          ...(workout as Workout),
          date: timestampsFromLastWeek.splice(
            Math.floor(Math.random() * 7),
            1,
          )[0],
        };
        await FirestoreActions.updateWorkoutById(
          userId,
          workoutId,
          updatedWorkout,
        );
      });
    });
  },
};
