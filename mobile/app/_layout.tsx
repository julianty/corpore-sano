import { useEffect, useState, createContext } from "react";
import { View, ActivityIndicator } from "react-native";
import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@shared/store";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector, useAppDispatch } from "@shared/hooks";
import { authSlice } from "@shared/features/auth/authSlice";
import { UserProfile } from "@shared/types";
import { listenAuthState, signOut } from "../src/lib/auth";
import { LoginScreen } from "../src/components/LoginScreen";

export type UserProfileContextType = {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleSignOut: () => void;
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

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: displayName,
    weightUnit: "lbs",
    colorScheme: "dark",
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = listenAuthState((user) => {
      if (user) {
        dispatch(
          authSlice.actions.logInUser({
            uid: user.uid,
            displayName: user.displayName ?? user.email ?? "User",
          }),
        );
      } else {
        dispatch(authSlice.actions.logOutUser());
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (userId === "demoUser") {
      FirestoreActions.updateDemoData();
    }
  }, [userId]);

  useEffect(() => {
    FirestoreActions.fetchUserProfile(userId).then((profile) => {
      if (!profile) return;
      setUserProfile((prev) => ({
        ...prev,
        username: displayName,
        weightUnit: profile.weightUnit,
        colorScheme: profile.colorScheme,
        customExercises: profile.customExercises ?? {},
      }));
    });
  }, [userId, displayName]);

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

  if (!isAuthenticated) {
    return <LoginScreen onDemoMode={() => setDemoMode(true)} />;
  }

  return (
    <UserProfileContext.Provider
      value={{ userProfile, setUserProfile, handleSignOut }}
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
