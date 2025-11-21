import styled from "@emotion/styled";
import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Badge status={status}>
      <Text color="light-200" size="lg">
        {capitalize(status)}
      </Text>
    </Badge>
  );
}

const Badge = styled.div<{ status: string }>`
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 8px;
  background: ${({ status }) =>
    status === "filled"
      ? `${COLORS.aqua}20`
      : status === "pending"
        ? `${COLORS.yellow}20`
        : COLORS["grey-500"]};
  border: 1px solid
    ${({ status }) =>
      status === "filled"
        ? COLORS.aqua
        : status === "pending"
          ? COLORS.yellow
          : COLORS["grey-400"]};
`;
