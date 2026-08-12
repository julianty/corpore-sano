import { Container, Grid, Stack, Text } from "@mantine/core";
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

export type UserProfileContextType = {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
};

export const UserProfileContext = createContext<
  UserProfileContextType | undefined
>(undefined);

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
        weightUnit: profile!.weightUnit ?? "lbs",
        colorScheme: profile!.colorScheme,
      };
      setUserProfile(newUserProfile);
    });
  }, [userId, displayName]);
  return (
    <Container
      fluid
      maw={{ base: 480, md: 1320 }}
      mx="auto"
      px={{ base: 0, sm: "md", lg: 40 }}
    >
      <UserProfileContext.Provider value={{ userProfile, setUserProfile }}>
        <Stack gap="lg" py="md" px={{ base: "sm", sm: 0 }}>
          <Header />
          <main id="main-content">
            <Stack gap="lg">
              {userId === "demoUser" ? (
                <Hero />
              ) : (
                <Text>Welcome {displayName}!</Text>
              )}
              <Grid gutter={{ base: "lg", md: 40 }}>
                <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
                  <Dashboard />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
                  <WorkoutTool />
                </Grid.Col>
              </Grid>
            </Stack>
          </main>
        </Stack>
      </UserProfileContext.Provider>
    </Container>
  );
}

export default App;
