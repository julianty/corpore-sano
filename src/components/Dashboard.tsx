import { Stack, Title } from "@mantine/core";
// import { MuscleDiagram } from "../components/MuscleDiagram";
import WeeklySummary from "../components/WeeklySummary";

export function Dashboard() {
  return (
    <Stack>
      {/* <MuscleDiagram /> */}
      <Title order={2}>Summary</Title>
      <WeeklySummary />
    </Stack>
  );
}
