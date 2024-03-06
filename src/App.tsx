import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { Title, Group, Container, Center } from "@mantine/core";
// import { Dashboard } from "./pages/Dashboard";
import { GoogleLogin } from "./components/GoogleLogin";
import { WorkoutTool } from "./pages/WorkoutTool";

function App() {
  return (
    <Container mt={"lg"}>
      <Center>
        <Title m={"lg"}>Corpore Sano</Title>
      </Center>
      <Center>
        <GoogleLogin />
      </Center>
      {/* <Dashboard /> */}
      <WorkoutTool />
    </Container>
  );
}

export default App;
