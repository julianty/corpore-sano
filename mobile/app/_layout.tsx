import { useEffect, useState, createContext } from "react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@shared/store";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector, useAppDispatch } from "@shared/hooks";
import { authSlice } from "@shared/features/auth/authSlice";
import { UserProfile } from "@shared/types";
import { listenAuthState, signInAnonymously, signOut } from "../src/lib/auth";
import { LoginScreen } from "../src/components/LoginScreen";

export type UserProfileContextType = {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleSignOut: () => void;
  resolvedColorScheme: "light" | "dark";
};

export const UserProfileContext = createContext<
  UserProfileContextType | undefined
>(undefined);

function AppProviders() {
  const userId = useAppSelector((state) => state.auth.userId);
  const displayName = useAppSelector((state) => state.auth.displayName);
  const dispatch = useAppDispatch();

  const [authChecked, setAuthChecked] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const deviceScheme = useColorScheme() ?? "dark";

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: displayName,
    weightUnit: "lbs",
    colorScheme: "system",
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = listenAuthState((user) => {
      // An anonymous session backs demo mode only — it must not become the
      // Redux userId, or every `userId === "demoUser"` check and Firestore
      // path that expects the literal "demoUser" doc would break.
      if (user && !user.isAnonymous) {
        dispatch(
          authSlice.actions.logInUser({
            uid: user.uid,
            displayName: user.displayName ?? user.email ?? "User",
          }),
        );
      } else if (!user) {
        dispatch(authSlice.actions.logOutUser());
      }
      // If user is anonymous, do nothing — userId stays "demoUser".
      setAuthChecked(true);
    });
    return unsubscribe;
  }, [dispatch]);

  // Firestore rules require request.auth != null for every path, so these
  // fetches must wait until a session — real login or a successful anonymous
  // demo sign-in — actually exists, not just until auth state is checked.
  const sessionReady = authChecked && (demoMode || userId !== "demoUser");

  useEffect(() => {
    if (!sessionReady) return;
    if (userId === "demoUser") {
      FirestoreActions.updateDemoData();
    }
  }, [userId, sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;
    FirestoreActions.fetchUserProfile(userId).then((profile) => {
      if (!profile) return;
      setUserProfile((prev) => ({
        ...prev,
        username: displayName,
        weightUnit: profile.weightUnit ?? "lbs",
        colorScheme: profile.colorScheme ?? "system",
        customExercises: profile.customExercises ?? {},
      }));
    });
  }, [userId, displayName, sessionReady]);

  // Waiting for Firebase to report auth state
  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isAuthenticated = demoMode || userId !== "demoUser";

  function handleSignOut() {
    setDemoMode(false);
    signOut().catch(() => {
      // If there's no Firebase session (demo mode), signOut errors silently — that's fine
    });
  }

  const resolvedColorScheme: "light" | "dark" =
    userProfile.colorScheme === "system" ? deviceScheme : userProfile.colorScheme;

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onDemoMode={async () => {
          // Demo mode still needs a real Firebase session so Firestore
          // requests to the demoUser path satisfy the security rules. Let a
          // failure propagate to LoginScreen rather than entering demo mode
          // with no working session.
          await signInAnonymously();
          setDemoMode(true);
        }}
      />
    );
  }

  return (
    <UserProfileContext.Provider
      value={{ userProfile, setUserProfile, handleSignOut, resolvedColorScheme }}
    >
      <Slot />
    </UserProfileContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppProviders />
    </Provider>
  );
}
