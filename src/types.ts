import { Timestamp } from "firebase/firestore";

export interface Exercise {
  order: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Workout {
  date: Timestamp | undefined;
  exercises?: ExerciseMap;
}

export interface ExerciseMap {
  [id: string]: Exercise;
}
