import "@mantine/core/styles.css";
import "./index.css";
import { AppShell, Title } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MuscleDiagram } from "./components/MuscleDiagram";
import { Paper, Grid, Stack } from "@mantine/core";

function Dashboard() {
  const paperStyle = {
    // margin: "20px",
    p: "md",
    withBorder: true,
  };
  return (
    <Grid w="100vw">
      <Grid.Col span={12}>buttons</Grid.Col>
      <Grid.Col span={6}>
        <Paper {...paperStyle}>
          <MuscleDiagram />
        </Paper>
      </Grid.Col>
      <Grid.Col span={3}>
        <Stack>
          <Paper h="30vh" {...paperStyle}></Paper>
          <Paper h="30vh" {...paperStyle}></Paper>
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
