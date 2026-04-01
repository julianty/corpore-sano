import { UserProfile } from "../../types";

/**
 * Platform-agnostic data repository interface for user profile/preferences.
 *
 * Web: implemented by FirestoreUserRepository (Firebase)
 * Mobile (future): local device storage or cloud sync
 */
export interface IUserRepository {
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  updateUserProfile(userId: string, profile: UserProfile): Promise<void>;
  getFavoriteExercises(userId: string): Promise<string[]>;
  updateFavoriteExercises(userId: string, favorites: string[]): Promise<void>;
}
