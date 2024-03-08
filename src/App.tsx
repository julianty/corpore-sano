import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { Title, Container, Center } from "@mantine/core";
// import { Dashboard } from "./pages/Dashboard";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./pages/WorkoutTool";

function App() {
  return (
    <Container px={0}>
      <Center bg="red">
        <Title m={"lg"} c="white">
          Corpore Sano
        </Title>
      </Center>
      <Center p={10}>
        <GoogleLogin />
      </Center>
      <Container p="md">
        {/* <Dashboard /> */}
        <WorkoutTool />
      </Container>
    </Container>
  );
}

export default App;
