import { Accordion, Stack, Title } from "@mantine/core";
// import { MuscleDiagram } from "../components/MuscleDiagram";
import WeeklySummary from "./WeeklySummary";

export function Dashboard() {
  return (
    <Stack>
      {/* <MuscleDiagram /> */}
      <Title order={2}>Summary</Title>
      <Accordion>
        <Accordion.Item value="Weekly Summary">
          <Accordion.Control>Weekly Summary</Accordion.Control>
          <Accordion.Panel>
            <WeeklySummary />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
