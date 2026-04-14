import { Timestamp } from "firebase/firestore";

export interface SetEntry {
  reps: number;
  weightlbs: number;
  weightkg: number;
}

export interface Exercise {
  order: number;
  name: string;
  variant: string;
  sets: SetEntry[];
}

export interface Workout {
  // This should match the firestore workouts
  date: Timestamp | undefined;
  exercises?: ExerciseMap;
  durationSeconds?: number;
}

export interface ExerciseMap {
  [id: string]: Exercise;
}

export interface WorkoutsObject {
  [workoutId: string]: React.ReactElement;
}
export interface ExerciseRowProps {
  exercise: Exercise;
  exerciseKey: string;
  onSetsChange: (key: string, sets: SetEntry[]) => void;
  closeHandler: (key: string) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string,
  ) => void;
  editMode: boolean;
  isMobile: boolean;
}
export interface ExerciseFieldsProps {
  exercisesObject: ExerciseMap;
  onSetsChange: (key: string, sets: SetEntry[]) => void;
  closeHandler: (workoutId: string) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string,
  ) => void;
  editMode: boolean;
  isMobile: boolean;
}

export interface Muscle {
  name: string;
  sets: number;
  weightTotal?: number;
  parentGroup: string;
  lastWorked?: number;
}

export interface MuscleSummary {
  [name: string]: Muscle;
}

export interface UserProfile {
  username?: string | undefined;
  weightUnit: "lbs" | "kg";
  colorScheme: "light" | "dark";
  exerciseHistory?: [ExerciseHistory];
  favoriteExercises?: [string];
}

export interface WorkoutEntry {
  id: string;
  data: Workout;
}

// TODO: Make it possible to jump to the workout wherein the maximum lift was hit.
export interface ExerciseHistory {
  // Do I need unique exercise IDs?
  // id: string;
  // Exercise name e.g. Overhead Press
  name: string;
  // Maximum lift on record
  maxKg: number;
  // Last recorded lift
  lastKg: number;
}
