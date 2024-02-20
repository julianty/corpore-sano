import app from "../initializeFirebase";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

export const FirestoreActions = {
  // Might need to throw this out in the case where I only upload specific
  // entires as they change instead of amending the whole user file?
  // maybe it's managable by using the {merge: true} option
  update: async (userId: string) => {
    // const db = getFirestore(app);
    // const docRef = doc(db, "users", userId);
    // const docSnap = await getDoc(docRef);
    console.log(userId);
    console.log("saving Data");
  },
  fetchData: async (userId: string) => {
    const db = getFirestore(app);
    const data = await getDoc(
      doc(db, "users", userId, "workouts", "workout001")
    );
    return data.data();
  },
  fetchWorkoutIds: async (userId:string) => {
    const db = getFirestore(app);
    const querySnapshot = await getDocs(
      collection(db, "users", userId, "workouts")
    )
    const workoutIdArray:Array<string> = []
    querySnapshot.forEach((doc) => {
      workoutIdArray.push(doc.id)
    })
    return workoutIdArray
  }
};
