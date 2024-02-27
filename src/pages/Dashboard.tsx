import { MuscleDiagram } from "../components/MuscleDiagram";
import { Paper, Grid, Stack } from "@mantine/core";

export function Dashboard() {
  const paperStyle = {
    p: "md",
    withBorder: true,
  };
  return (
    <Grid columns={2} w="100vw" overflow="hidden">
      <Grid.Col span={2}>buttons</Grid.Col>
      <Grid.Col span={"content"}>
        <Paper w="450px" {...paperStyle}>
          <MuscleDiagram />
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 1, md: 1, sm: 2 }}>
        <Stack>
          <Paper {...paperStyle}></Paper>
          <Paper {...paperStyle}></Paper>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
