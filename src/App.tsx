import "@mantine/core/styles.css";
import "./index.css";
import { AppShell, Title } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MuscleDiagram } from "./components/MuscleDiagram";
import { Paper, Grid, Stack } from "@mantine/core";

function Dashboard() {
  const paperStyle = {
    // margin: "20px",
  };
  return (
    <Grid>
      <Grid.Col span={12}>buttons</Grid.Col>
      <Grid.Col span={6}>
        <Paper style={{ height: "60vh", ...paperStyle }} withBorder>
          <MuscleDiagram />
        </Paper>
      </Grid.Col>
      <Grid.Col span={6}>
        <Stack>
          <Paper style={{ height: "30vh", ...paperStyle }} withBorder></Paper>
          <Paper style={{ height: "30vh", ...paperStyle }} withBorder></Paper>
        </Stack>
      </Grid.Col>
    </Grid>
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
]);

function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 100, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Title>Corpore Sano</Title>
      </AppShell.Header>
      <AppShell.Navbar p="md">Navbar</AppShell.Navbar>
      <AppShell.Main>
        <RouterProvider router={router} />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
