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
  customExerciseId?: string;
}

export interface Workout {
  // This should match the firestore workouts
  date: Timestamp | undefined;
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
  customExerciseId?: string;
  onSetsChange: (key: string, sets: SetEntry[]) => void;
  closeHandler: (key: string) => void;
  exerciseNameChangeHandler: (
    name: string,
    variant: string,
    key: string,
    customExerciseId?: string,
  ) => void;
  editMode: boolean;
  isMobile: boolean;
  onHistoryPress?: (key: string) => void;
}
export interface ExerciseFieldsProps {
  customExerciseId?: string;
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
  colorScheme: "light" | "dark" | "system";
  favoriteExercises?: [string];
  customExercises?: Record<
    string,
    { name: string; muscleGroup: string | null }
  >;
}

export interface WorkoutEntry {
  id: string;
  data: Workout;
}
