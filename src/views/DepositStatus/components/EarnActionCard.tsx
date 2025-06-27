import styled from "@emotion/styled";
import { ReactNode } from "react";

import { ReactComponent as A } from "assets/bg-banners/action-card-banner-a.svg";
import { ReactComponent as B } from "assets/bg-banners/action-card-banner-b.svg";
import { ReactComponent as C } from "assets/bg-banners/action-card-banner-c.svg";
import { Text } from "components/Text";
import { COLORS } from "utils";

const BG_VARIANTS = {
  a: A,
  b: B,
  c: C,
} as const;

type Props = {
  title: ReactNode;
  subTitle: ReactNode;
  LeftIcon: ReactNode;
  ActionButton: ReactNode;
  color: "teal" | "aqua";
  backgroundVariant: keyof typeof BG_VARIANTS;
};

export function EarnActionCard({
  title,
  subTitle,
  LeftIcon,
  ActionButton,
  color,
  backgroundVariant,
}: Props) {
  const Bg = BG_VARIANTS[backgroundVariant];
  return (
    <Wrapper color={color}>
      <Bg />
      <InnerWrapper color={color}>
        {LeftIcon}
        <TextWrapper>
          {title}
          <Text size="sm">{subTitle}</Text>
        </TextWrapper>
        {ActionButton}
      </InnerWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.div<{
  color: Props["color"];
}>`
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(
    90deg,
    ${({ color }) => (color === "aqua" ? COLORS["aqua-5"] : COLORS["teal-5"])}
      0%,
    ${({ color }) => (color === "aqua" ? COLORS["aqua-0"] : COLORS["teal-0"])}
      100%
  );
  background-size: cover;

  > svg {
    position: absolute;
    object-fit: cover;
    object-position: top;
    pointer-events: none;
  }
`;

const InnerWrapper = styled.div<{ color: "teal" | "aqua" }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;

  border: 1px solid
    ${({ color }) => (color === "aqua" ? COLORS["aqua-15"] : COLORS["teal-15"])};
  border-radius: 0.5rem;
`;

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
