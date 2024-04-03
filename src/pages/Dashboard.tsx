import { Paper, Title } from "@mantine/core";
// import { MuscleDiagram } from "../components/MuscleDiagram";
import WeeklySummary from "../components/WeeklySummary";

export function Dashboard() {
  const paperStyle = {
    p: "md",
    withBorder: true,
  };
  return (
    <Paper w="450px" {...paperStyle}>
      {/* <MuscleDiagram /> */}
      <Title order={3}>This week</Title>
      <WeeklySummary />
    </Paper>
  );
}
