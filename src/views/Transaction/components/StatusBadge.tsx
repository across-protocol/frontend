import styled from "@emotion/styled";
import { withOpacity } from "utils/colors";

type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return <Badge status={status}>{capitalize(status)}</Badge>;
}

const Badge = styled.div<{ status: string }>`
  display: inline-flex;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
  padding: 4px 16px;
  --accent-color: ${({ status }) =>
    status === "filled"
      ? "var(--base-aqua)"
      : status === "refunded"
        ? "var(--functional-yellow)"
        : "var(--base-bright-gray)"};
  color: var(--accent-color);
  background: ${withOpacity("var(--accent-color)", 0.2)};
  border: 2px solid ${withOpacity("var(--accent-color)", 0.4)};
`;
