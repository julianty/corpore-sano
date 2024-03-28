import { Paper, Title } from "@mantine/core";
import { MuscleDiagram } from "../components/MuscleDiagram";

export function Dashboard() {
  const paperStyle = {
    p: "md",
    withBorder: true,
  };
  return (
    <Paper w="450px" {...paperStyle}>
      <MuscleDiagram />
      <Title order={3}>Workout Summary</Title>
    </Paper>
  );
}
