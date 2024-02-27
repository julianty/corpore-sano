import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { AppShell, Burger, Title, Group, Anchor } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Dashboard } from "./pages/Dashboard";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./pages/WorkoutTool";

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
