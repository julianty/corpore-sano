import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { Title, Stack, Group, Container, Flex } from "@mantine/core";
// import { Dashboard } from "./pages/Dashboard";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./components/WorkoutTool";
import { IconBarbell } from "@tabler/icons-react";
import { Dashboard } from "./components/Dashboard";
function App() {
  return (
    <Container>
      <Stack p={{ sm: "sm", md: "lg" }}>
        <Group justify="space-between">
          <Flex align={"center"} gap="sm" pt={"sm"}>
            <Title>Corpore Sano</Title>
            <IconBarbell size={36} />
          </Flex>
          <GoogleLogin />
        </Group>
        <Stack p={{ sm: "sm", md: "lg" }}>
          <Dashboard />
          <WorkoutTool />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
