import { ModalProps } from "@mantine/core";
import { Timestamp } from "firebase/firestore";

export interface Exercise {
  order: number;
  name: string;
  variant: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Workout {
  // This should match the firestore workouts
  date: Timestamp | undefined;
  exercises?: ExerciseMap;
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
  changeHandler: (
    value: string | number,
    key: string,
    fieldName: keyof Exercise
  ) => void;
  closeHandler: (key: string) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string
  ) => void;
  editMode: boolean;
}
export interface ExerciseFieldsProps {
  exercisesObject: ExerciseMap;
  changeHandler: (
    value: string | number,
    key: string,
    field: keyof Exercise
  ) => void;
  closeHandler: (workoutId: string) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string
  ) => void;
  editMode: boolean;
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
  weightUnit?: "lbs" | "kg";
  colorScheme?: "light" | "dark";
  exerciseHistory?: [ExerciseHistory];
  favoriteExercises?: [string];
}

export interface UserPreferencesModalProps extends ModalProps {
  userProfileSetterCallback: (userProfile: UserProfile) => void;
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
