import { Container, Stack, Text } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { createContext, useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { Header } from "./components/Header";
import { WorkoutTool } from "./components/WorkoutTool/WorkoutTool";
import { FirestoreActions } from "./helperFunctions/FirestoreActions";
import { useAppSelector } from "./hooks";
import "./index.css";
import { UserProfile } from "./types";
import { Hero } from "./components/Hero";

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
    // Ensure that the demo data is updated when the demo user logs in
    if (userId === "demoUser") {
      FirestoreActions.updateDemoData();
    }
  }, [userId]);

  useEffect(() => {
    // TODO: Update this to read favoriteExercises and ExerciseHistory
    // Update user profile based on new user
    const userProfile = FirestoreActions.fetchUserProfile(userId);
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
      <UserProfileContext.Provider value={userProfile}>
        <Stack p={{ sm: "sm", md: "lg" }}>
          <Header userProfileSetterCallback={setUserProfile} />
          <Stack p={{ sm: "sm", md: "lg" }}>
            {userId === "demoUser" ? (
              <Hero />
            ) : (
              <Text>Welcome {displayName}!</Text>
            )}
            <Dashboard />
            <WorkoutTool />
          </Stack>
        </Stack>
      </UserProfileContext.Provider>
    </Container>
  );
}

export default App;
