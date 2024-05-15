import styled from "@emotion/styled";

import { Text, TextColor, TextSize } from "components/Text";

import { formatSeconds } from "utils";

type Props = {
  elapsedSeconds?: number;
  maxSeconds?: number;
  MaxSecondsFallback?: React.ReactNode;
  textColor?: TextColor;
  StatusIcon?: React.ReactNode;
  isCompleted?: boolean;
  textSize?: TextSize;
};

export function ElapsedTime({
  elapsedSeconds = 0,
  maxSeconds = Infinity,
  MaxSecondsFallback = <></>,
  StatusIcon,
  isCompleted,
  textSize,
  textColor,
}: Props) {
  if (elapsedSeconds >= maxSeconds && !isCompleted) {
    return <>{MaxSecondsFallback}</>;
  }

  return (
    <Wrapper>
      <Text
        size={textSize}
        color={textColor || (isCompleted ? "aqua" : "white")}
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
