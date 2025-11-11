import styled from "@emotion/styled";
import { Text, TextColor, TextSize } from "components/Text";
import { CopyIconButton } from "./CopyIconButton";
import { CSSProperties } from "react";

type Props = {
  textToCopy: string;
  children: React.ReactNode;
  color?: TextColor;
  size?: TextSize;
  weight?: number;
  style?: CSSProperties;
};

export function CopyableText({
  textToCopy,
  children,
  color,
  size,
  weight,
  style,
}: Props) {
  return (
    <Wrapper>
      <Text color={color} size={size} weight={weight} style={style}>
        {children}
      </Text>
      <CopyIconButton textToCopy={textToCopy} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
