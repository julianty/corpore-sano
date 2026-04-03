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
    <Paper p="md" withBorder>
      <Title order={5}>Muscle Groups</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Group</Table.Th>
            <Table.Th>Sets this week</Table.Th>
            <Table.Th>Last Worked</Table.Th>
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
              <Table.Tr key={group}>
                <Table.Td>{group}</Table.Td>
                <Table.Td>{data.sets}</Table.Td>
                <Table.Td
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
