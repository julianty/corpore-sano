// Created to handle migrations in database for schema changes/etc

import {
  getDocs,
  collection,
  getFirestore,
  doc,
  updateDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateWeights() {
  // Get a list of all users
  const usersRef = collection(db, "users");
  const usersList = await getDocs(usersRef);
  // Loop through list
  usersList.forEach(async (userDoc) => {
    const userId = userDoc.id;
    //  Get list of workouts
    const workoutsRef = collection(db, "users", userId, "workouts");
    const workoutList = await getDocs(workoutsRef);
    // console.log(workoutList.docs[0]);
    //  Loop through workouts
    workoutList.forEach(async (workoutDoc) => {
      const workoutId = workoutDoc.id;
      const workoutData = { ...workoutDoc.data() };
      let updated = false;

      // Loop through each exercise in the workout
      for (const [exerciseKey, exercise] of Object.entries(workoutData)) {
        if (
          exercise &&
          typeof exercise === "object" &&
          typeof exercise.weight === "number"
        ) {
          exercise.weightlbs = exercise.weight;
          exercise.weightkg = Math.round((exercise.weight / 2.20462) * 10) / 10;
          delete exercise.weight;
          workoutData[exerciseKey] = exercise;
          updated = true;
        }
      }

      if (updated) {
        const workoutRef = doc(db, "users", userId, "workouts", workoutId);
        await updateDoc(workoutRef, workoutData);
        console.log(`Migrated workout ${workoutId} for user ${userId}`);
      }
    });
  });
}
migrateWeights();
