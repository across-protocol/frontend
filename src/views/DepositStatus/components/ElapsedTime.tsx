import styled from "@emotion/styled";

import { Text, TextSize } from "components/Text";

import { formatSeconds } from "utils";
import { DepositStatus } from "../types";

type Props = {
  elapsedSeconds?: number;
  maxSeconds?: number;
  MaxSecondsFallback?: React.ReactNode;
  textColor?: string;
  StatusIcon?: React.ReactNode;
  isCompleted?: boolean;
  textSize?: TextSize;
  status: DepositStatus;
};

export function ElapsedTime({
  elapsedSeconds = 0,
  maxSeconds = Infinity,
  MaxSecondsFallback = <></>,
  StatusIcon,
  textSize,
  status,
}: Props) {
  if (elapsedSeconds >= maxSeconds && status !== "filled") {
    return <>{MaxSecondsFallback}</>;
  }

  return (
    <Wrapper>
      <Text
        size={textSize}
        color={
          status === "filled"
            ? "aqua"
            : status === "deposit-reverted"
            ? "warning"
            : "white"
        }
      >
        {formatSeconds(elapsedSeconds) ?? "00h 00m 00s"}
      </Text>
      {StatusIcon && StatusIcon}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;
