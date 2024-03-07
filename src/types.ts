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
