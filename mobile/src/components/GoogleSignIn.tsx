import { useEffect } from "react";
import { Button } from "react-native-paper";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import app from "@shared/initializeFirebase";

const auth = getAuth(app);

export function GoogleSignIn() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.userId);
  const isLoggedIn = userId !== "demoUser";

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  async function handleSignIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const credential = GoogleAuthProvider.credential(data?.idToken ?? null);
      const result = await signInWithCredential(auth, credential);
      dispatch({
        type: "auth/logInUser",
        payload: {
          uid: result.user.uid,
          displayName: result.user.displayName ?? "User",
        },
      });
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error("Google Sign-In error:", error);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    await GoogleSignin.signOut();
    dispatch({ type: "auth/logOutUser" });
  }

  if (isLoggedIn) {
    return (
      <Button mode="outlined" onPress={handleSignOut}>
        Sign Out
      </Button>
    );
  }

  return (
    <Button mode="contained" onPress={handleSignIn} icon="google">
      Sign in with Google
    </Button>
  );
}
