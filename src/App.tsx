import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { AppShell, Burger, Title, Group, Anchor } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Dashboard } from "./components/Dashboard";
import { WorkoutInstance } from "./components/WorkoutInstance";
import { useEffect, useState } from "react";
import { useAppSelector } from "./hooks";
import { FirestoreActions } from "./components/FirestoreActions";
import { GoogleLogin } from "./GoogleLogin";

function WorkoutTool() {
  const [workoutIdArray, setWorkoutIdArray] = useState<Array<string>>([]);
  const userId = useAppSelector((state) => state.auth.userId);
  const [workouts, setWorkouts] = useState<Array<React.ReactElement>>([]);
  useEffect(() => {
    // Fetches the workout Ids from firebase
    setWorkoutIdArray([]);
    FirestoreActions.fetchWorkoutIds(userId).then((value) => {
      setWorkoutIdArray(value);
    });
  }, [userId]);
  useEffect(() => {
    setWorkouts(
      workoutIdArray.map((workoutId) => (
        <WorkoutInstance key={`workoutId${workoutId}`} workoutId={workoutId} />
      ))
    );
  }, [workoutIdArray]);
  return (
    <div>
      <Title>Workout Tool</Title>
      {workouts}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/about",
    element: <div>about?</div>,
  },
  {
    path: "/tool",
    element: <WorkoutTool />,
  },
]);

function App() {
  const [opened, { toggle }] = useDisclosure();
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 100,
        breakpoint: "xs",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group>
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size={"sm"}
          />
          <Title>Corpore Sano</Title>
          <GoogleLogin />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Anchor href="/">Home</Anchor>
        <Anchor href="/about">About</Anchor>
        <Anchor href="/tool">Tool</Anchor>
      </AppShell.Navbar>
      <AppShell.Main>
        <RouterProvider router={router} />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
