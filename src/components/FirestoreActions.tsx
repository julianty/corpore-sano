import app from "../initializeFirebase";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { Workout } from "../types";

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
    setDoc(docRef, document);
  },
  fetchData: async (userId: string, workoutId: string) => {
    const docRef = doc(db, "users", userId, "workouts", workoutId);
    // First check if data exists
    // const docSnap = await getDoc(docRef)
    const data = await getDoc(docRef);
    if (data.exists()) {
      return data.data();
    } else {
      console.log("FirestoreActions.fetchData: Document does not exist");
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
};
