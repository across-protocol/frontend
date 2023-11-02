import styled from "@emotion/styled";
import { ReactNode } from "react";

import TealBannerUrl from "assets/bg-banners/action-card-teal-banner.svg";

import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  title: ReactNode;
  subTitle: string;
  LeftIcon: ReactNode;
  ActionButton: ReactNode;
};

export function EarnActionCard({
  title,
  subTitle,
  LeftIcon,
  ActionButton,
}: Props) {
  return (
    <Wrapper>
      <InnerWrapper>
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

const Wrapper = styled.div`
  border-radius: 0.5rem;

  background-image: linear-gradient(
      90deg,
      rgba(40, 160, 240, 0.05) 0%,
      rgba(40, 160, 240, 0) 100%
    ),
    url(${TealBannerUrl});
  background-size: cover;
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  padding: 1.5rem 1rem;

  border: 1px solid ${COLORS["teal-15"]};
  border-radius: 0.5rem;
`;

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
