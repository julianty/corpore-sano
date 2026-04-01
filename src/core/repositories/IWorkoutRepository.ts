import { Workout } from "../../types";

/**
 * Platform-agnostic data repository interface for workout storage.
 *
 * Web: implemented by FirestoreWorkoutRepository (Firebase)
 * Mobile (future): implement with SQLite, AsyncStorage, or cloud sync
 */
export interface IWorkoutRepository {
  getWorkoutIds(userId: string): Promise<string[]>;
  getWorkoutsAfterDate(userId: string, date: Date): Promise<Workout[]>;
  getWorkoutById(
    userId: string,
    workoutId: string,
  ): Promise<Workout | undefined>;
  saveWorkout(
    userId: string,
    workoutId: string,
    workout: Workout,
  ): Promise<void>;
  deleteWorkout(userId: string, workoutId: string): Promise<void>;
}
