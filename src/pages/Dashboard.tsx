import { MuscleDiagram } from "../components/MuscleDiagram";
import { Paper } from "@mantine/core";

export function Dashboard() {
  const paperStyle = {
    p: "md",
    withBorder: true,
  };
  return (
    <Paper w="450px" {...paperStyle}>
      <MuscleDiagram />
    </Paper>
  );
}
