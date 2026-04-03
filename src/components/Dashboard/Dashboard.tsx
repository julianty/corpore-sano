import { Stack, Title } from "@mantine/core";
// import { MuscleDiagram } from "../components/MuscleDiagram";
import WeeklySummary from "./WeeklySummary";

export function Dashboard() {
  return (
    <article>
      <Stack>
        {/* <MuscleDiagram /> */}
        <Title order={2} id="dashboard-title">
          Summary
        </Title>
        <WeeklySummary />
      </Stack>
    </article>
  );
}
