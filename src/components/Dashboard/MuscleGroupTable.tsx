import { Paper, Title, Table } from "@mantine/core";
import { parentGroups } from "../../data/muscleGroups";
import {
  getLastWorkedFreshness,
  ParentGroupSummary,
} from "../../core/services/muscleCalculations";

const freshnessColor = {
  fresh: "var(--mantine-color-green-6)",
  moderate: "var(--mantine-color-yellow-6)",
  stale: "var(--mantine-color-orange-6)",
} as const;

export function MuscleGroupTable({
  parentMuscleGroupsNumSets,
}: {
  parentMuscleGroupsNumSets: ParentGroupSummary;
}) {
  return (
    <Paper p={{ base: "sm", sm: "md" }} withBorder>
      <Title order={5} mb="sm">Muscle Groups</Title>
      <Table verticalSpacing={6} withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th fz="xs" tt="uppercase" c="dimmed" fw={500}>
              Group
            </Table.Th>
            <Table.Th fz="xs" tt="uppercase" c="dimmed" fw={500} ta="right">
              Sets
            </Table.Th>
            <Table.Th fz="xs" tt="uppercase" c="dimmed" fw={500} ta="right">
              Last Worked
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {parentGroups.map((group) => {
            const data = parentMuscleGroupsNumSets[group];
            const raw = data.daysSinceLast;
            const freshness = getLastWorkedFreshness(raw);
            let label: string;
            if (raw === undefined) {
              label = "—";
            } else if (raw === 0) {
              label = "Today";
            } else {
              label = `${raw} days ago`;
            }
            return (
              <Table.Tr
                key={group}
                style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}
              >
                <Table.Td>{group}</Table.Td>
                <Table.Td ta="right" fw={600} c={data.sets > 0 ? "mint.4" : "dimmed"}>
                  {data.sets}
                </Table.Td>
                <Table.Td
                  ta="right"
                  style={{
                    color: freshnessColor[freshness],
                    fontWeight: freshness === "stale" ? 700 : undefined,
                  }}
                >
                  {label}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
