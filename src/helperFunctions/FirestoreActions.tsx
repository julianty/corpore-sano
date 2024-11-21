import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import app from "../initializeFirebase";
import { UserProfile, Workout } from "../types";

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
    document: Workout
  ) => {
    const docRef = doc(db, "users", userId, "workouts", workoutId);
    await setDoc(docRef, document);
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
        `FirestoreActions.fetchData: userId:${userId}, workoutId:${workoutId}`
      );
    }
  },
  fetchWorkoutIds: async (userId: string) => {
    const querySnapshot = await getDocs(
      collection(db, "users", userId, "workouts")
    );
    const queryResult = querySnapshot.docs;
    // Sorts workouts by date
    queryResult.sort(
      (docSnapshotA, docSnapshotB) =>
        docSnapshotA.data().date.seconds - docSnapshotB.data().date.seconds
    );
    // Returns only workout Ids
    const workoutIdArray = queryResult.map((docSnapshot) => docSnapshot.id);
    return workoutIdArray;
  },
  fetchWorkoutsAfterDate: async (userId: string, date: Date) => {
    const querySnapshot = await getDocs(
      collection(db, "users", userId, "workouts")
    );
    const queryResult = querySnapshot.docs;
    // Sorts workouts by date
    queryResult.sort(
      (docSnapshotA, docSnapshotB) =>
        docSnapshotA.data().date.seconds - docSnapshotB.data().date.seconds
    );
    const filteredResults = queryResult.filter((snapshot) => {
      return snapshot.data().date.seconds * 1000 > date.getTime();
    });
    return filteredResults.map((snapshot) => snapshot.data());
  },
  fetchUserProfile: async (userId: string) => {
    const userProfile = await getDoc(
      doc(db, "users", userId, "preferences", "userProfile")
    );
    return userProfile.data();
  },
  updateUserProfile: async (userId: string, userProfile: UserProfile) => {
    const docRef = doc(db, "users", userId, "preferences", "userProfile");
    await updateDoc(docRef, { ...userProfile });
  },
  fetchFavoriteExercises: async (userId: string) => {
    const userProfile = await getDoc(
      doc(db, "users", userId, "preferences", "userProfile")
    );
    if (userProfile.data() === undefined) {
      return [];
    } else {
      return userProfile.data()!.favoriteExercises;
    }
  },
  updateFavoriteExercises: async (
    userId: string,
    favoriteExercises: string[]
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
            1
          )[0],
        };
        await FirestoreActions.updateWorkoutById(
          userId,
          workoutId,
          updatedWorkout
        );
      });
    });
  },
};
