import { Card, Title, Divider, Table, Badge, Text, Paper } from "@mantine/core";
import type { RiskItem } from "../types";

export const ResultTable = ({ analysis }: { analysis: RiskItem[] }) => {
  const getBadgeColor = (rank: string) => {
    if (rank === "高") return "red";
    if (rank === "中") return "yellow";
    return "blue";
  };

  return (
    <Card withBorder shadow="md" p="xl" radius="md">
      <Title order={2} mb="lg">診断レポート</Title>
      <Divider mb="xl" />
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={100}>重要度</Table.Th>
            <Table.Th>リスク項目と修正案</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {analysis.map((item, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Badge color={getBadgeColor(item.rank)} variant="filled">{item.rank}</Badge>
              </Table.Td>
              <Table.Td>
                <Text fw={700} size="lg" mb={5}>{item.title}</Text>
                <Text size="sm" c="dimmed" mb="xs">{item.description}</Text>
                <Paper p="xs" bg="gray.0" withBorder>
                  <Text size="xs" fw={700} c="blue.9">【修正案】</Text>
                  <Text size="xs">{item.action}</Text>
                </Paper>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
};