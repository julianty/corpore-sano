import { useEffect, useState, createContext } from "react";
import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@shared/store";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { useAppSelector } from "@shared/hooks";
import { UserProfile } from "@shared/types";

export type UserProfileContextType = {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
};

export const UserProfileContext = createContext<
  UserProfileContextType | undefined
>(undefined);

function AppProviders() {
  const userId = useAppSelector((state) => state.auth.userId);
  const displayName = useAppSelector((state) => state.auth.displayName);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: displayName,
    weightUnit: "lbs",
    colorScheme: "dark",
  });

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
      }));
    });
  }, [userId, displayName]);

  return (
    <UserProfileContext.Provider value={{ userProfile, setUserProfile }}>
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
