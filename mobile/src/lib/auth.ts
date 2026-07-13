import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
// Reuse the shared Firebase app (Metro resolves the .native.ts variant), so
// Auth and Firestore live on the same SDK instance and Firestore requests
// carry the signed-in user's credentials.
import { app } from "@shared/initializeFirebase";

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // Already initialized (e.g. hot reload) — fall back to getAuth
  auth = getAuth(app);
}

export { auth };

// OAuth client IDs (public identifiers, not secrets — the iOS one also ships
// in GoogleService-Info.plist). `webClientId` is what makes the Google id_token
// acceptable to Firebase; `iosClientId` scopes the native iOS sign-in flow.
const WEB_CLIENT_ID =
  "2036797871-utt1sd9vr3m9prgcuv1hvvafsek4lmsf.apps.googleusercontent.com";
const IOS_CLIENT_ID =
  "2036797871-hu1fpquj4mgpldqlvjm66vta8s9ua9v5.apps.googleusercontent.com";

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
});

/** Sentinel returned when the user dismisses the Google account picker. */
export const GOOGLE_SIGN_IN_CANCELLED = "GOOGLE_SIGN_IN_CANCELLED";

/**
 * Runs the native Google sign-in flow, then exchanges the returned Google
 * id_token for a Firebase session on the shared `auth` instance (so Firestore
 * requests carry the user's credentials, same as email/password sign-in).
 * Throws `GOOGLE_SIGN_IN_CANCELLED` if the user dismisses the picker.
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (e: unknown) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error(GOOGLE_SIGN_IN_CANCELLED);
    }
    throw e;
  }
  if (!isSuccessResponse(response)) {
    // type === "cancelled": user backed out of the picker.
    throw new Error(GOOGLE_SIGN_IN_CANCELLED);
  }
  const { idToken } = response.data;
  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token.");
  }
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function listenAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
