import styled from "@emotion/styled";
import { ReactNode } from "react";

import TealBannerUrl from "assets/bg-banners/action-card-teal-banner.svg";
import AquaBannerUrl from "assets/bg-banners/action-card-aqua-banner.svg";

import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  title: ReactNode;
  subTitle: string;
  LeftIcon: ReactNode;
  ActionButton: ReactNode;
  color: "teal" | "aqua";
};

export function EarnActionCard({
  title,
  subTitle,
  LeftIcon,
  ActionButton,
  color,
}: Props) {
  return (
    <Wrapper color={color}>
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

const Wrapper = styled.div<{ color: string }>`
  border-radius: 0.5rem;

  background-image: linear-gradient(
      90deg,
      ${({ color }) => (color === "aqua" ? COLORS["aqua-5"] : COLORS["teal-5"])}
        0%,
      ${({ color }) => (color === "aqua" ? COLORS["aqua-0"] : COLORS["teal-0"])}
        100%
    ),
    url(${({ color }) => (color === "aqua" ? AquaBannerUrl : TealBannerUrl)});
  background-size: cover;
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
