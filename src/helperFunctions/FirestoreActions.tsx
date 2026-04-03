import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  getFirestore,
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
import app from "../initializeFirebase";
import { UserProfile, Workout, WorkoutEntry } from "../types";

export type WorkoutPageCursor = QueryDocumentSnapshot<DocumentData> | null;

const db = getFirestore(app);
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
      orderBy("date", "asc"),
    );
    const querySnapshot = await getDocs(workoutsQuery);
    return querySnapshot.docs.map((docSnapshot) => docSnapshot.id);
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
