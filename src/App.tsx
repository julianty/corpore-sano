import "@mantine/core/styles.css";
import "./index.css";
import {
  AppShell,
  Burger,
  Title,
  Group,
  Anchor,
  TextInput,
  NumberInput,
} from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Dashboard } from "./components/Dashboard";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
function WorkoutTool() {
  const form = useForm({
    initialValues: {
      workoutDate: new Date(),
      exercises: [{ name: "Lateral Raise", sets: 2, reps: 10, weight: 30 }],
    },
  });
  const exerciseFields = form.values.exercises.map((_, index) => {
    const uniqueId = `inputKey${index}`;
    return (
      <Group key={`Group${uniqueId}`}>
        <TextInput
          key={`${uniqueId}name`}
          {...form.getInputProps(`exercises.${index}.name`)}
        />
        <NumberInput
          key={`${uniqueId}sets`}
          {...form.getInputProps(`exercises.${index}.sets`)}
        />
        <NumberInput
          key={`${uniqueId}reps`}
          {...form.getInputProps(`exercises.${index}.reps`)}
        />
        <NumberInput
          key={`${uniqueId}weight`}
          {...form.getInputProps(`exercises.${index}.weight`)}
        />
      </Group>
    );
  });
  return (
    <div>
      <Title>Workout Tool</Title>
      <form>
        <DateInput {...form.getInputProps("workoutDate")} />
        {exerciseFields}
      </form>
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
