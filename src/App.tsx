import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { Stack, Container, Text } from "@mantine/core";
import { WorkoutTool } from "./components/WorkoutTool";
import { Dashboard } from "./components/Dashboard";
import { createContext, useEffect, useState } from "react";
import { UserProfile } from "./types";
import { useAppSelector } from "./hooks";
import { FirestoreActions } from "./helperFunctions/FirestoreActions";
import { Header } from "./components/Header";

export const UserProfileContext = createContext<UserProfile | undefined>(
  undefined
);

function App() {
  const displayName = useAppSelector((state) => state.auth.displayName);
  const userId = useAppSelector((state) => state.auth.userId);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: displayName,
    weightUnit: "lbs",
    colorScheme: "dark",
  });
  useEffect(() => {
    // Update user profile based on new user
    const userProfile = FirestoreActions.fetchUserPreferences(userId);
    userProfile.then((profile) => {
      const newUserProfile = {
        ...userProfile,
        username: displayName,
        weightUnit: profile!.weightUnit,
        colorScheme: profile!.colorScheme,
      };
      setUserProfile(newUserProfile);
    });
  }, [userId, displayName]);
  return (
    <Container>
      <Stack p={{ sm: "sm", md: "lg" }}>
        <UserProfileContext.Provider value={userProfile}>
          <Header userProfileSetterCallback={setUserProfile} />
        </UserProfileContext.Provider>
        <Stack p={{ sm: "sm", md: "lg" }}>
          <Text>Welcome {displayName}!</Text>
          <Dashboard />
          <WorkoutTool />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
