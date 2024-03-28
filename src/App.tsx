import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { Title, Stack, Group, Container, Flex } from "@mantine/core";
// import { Dashboard } from "./pages/Dashboard";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./pages/WorkoutTool";
import { IconBarbell } from "@tabler/icons-react";

function App() {
  return (
    <Container>
      <Stack p={{ sm: "sm", md: "lg" }}>
        <Group justify="space-between">
          <Flex align={"center"} gap={"lg"} pt={"sm"}>
            <Title m={{ sm: "sm", md: "lg" }}>Corpore Sano</Title>
            <IconBarbell size={36} />
          </Flex>
          <GoogleLogin />
        </Group>
        {/* <Dashboard /> */}
        <WorkoutTool />
      </Stack>
    </Container>
  );
}

export default App;
