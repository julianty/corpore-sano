import "@mantine/core/styles.css";
import "./App.css";
import { AppShell, Text } from "@mantine/core";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>main contents</div>,
  },
  {
    path: "/about",
    element: <div>about?</div>,
  },
]);

function App() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
      <AppShell.Header>
        <Text>Corpore Sano</Text>
      </AppShell.Header>
      <AppShell.Navbar p="md">Navbar</AppShell.Navbar>
      <AppShell.Main>
        <RouterProvider router={router} />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
