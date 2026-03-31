import { Accordion, Stack, Title } from "@mantine/core";
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
        <Accordion aria-labelledby="dashboard-title">
          <Accordion.Item value="Weekly Summary">
            <Accordion.Control>Weekly Summary</Accordion.Control>
            <Accordion.Panel>
              <WeeklySummary />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </article>
  );
}
