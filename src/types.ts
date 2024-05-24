import { Timestamp } from "firebase/firestore";

export interface Exercise {
  order: number;
  name: string;
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
  editMode: boolean;
}

export interface Muscle {
  name: string;
  sets: number;
  weightTotal?: number;
  parentGroup: string;
}

export interface MuscleSummary {
  [name: string]: { muscle: Muscle; lastWorked?: number };
}

export interface UserProfile {
  username: string;
  weightUnit: ["lbs", "kg"];
  colorScheme: ["light", "dark"];
}
