import styled from "@emotion/styled";
import { ReactComponent as Background } from "assets/bg-banners/overview-card-background.svg";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { Text } from "components";
import { ReactNode } from "react";
import { COLORS, QUERIESV2 } from "utils";
import { Tooltip } from "components/Tooltip";

type GenericOverviewCardTitleProps = {
  subTitle?: ReactNode;
  title: string;
  tooltip?: {
    content: string;
    title: string;
  };
};

type GenericOverviewCardProps = {
  upperCard: GenericOverviewCardTitleProps;
  lowerCard?: ReactNode;
  thinVerticalPadding?: boolean;
};

const GenericOverviewCard = ({
  upperCard,
  lowerCard,
  thinVerticalPadding,
}: GenericOverviewCardProps) => (
  <Wrapper>
    <BackgroundWrapper>
      <Background />
    </BackgroundWrapper>
    <ContentWrapper thinVerticalPadding={thinVerticalPadding}>
      <UpperCardStack>
        <UpperCardTitleStack>
          <Text size="md" color="grey-400">
            {upperCard.title}
          </Text>
          {upperCard.subTitle}
        </UpperCardTitleStack>
        {upperCard.tooltip && (
          <Tooltip
            tooltipId={upperCard.tooltip.title}
            title={upperCard.tooltip.title}
            body={
              <Text size="sm" color="white">
                {upperCard.tooltip.content}
              </Text>
            }
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        )}
      </UpperCardStack>
      {lowerCard && (
        <>
          <Divider />
          {lowerCard}
        </>
      )}
    </ContentWrapper>
  </Wrapper>
);

export default GenericOverviewCard;

const Wrapper = styled.div`
  // Layout
  display: flex;

  position: relative;

  width: 100%;

  // Style
  border-radius: 12px;
  border: 1px solid ${COLORS["grey-600"]};
  background: ${COLORS["black-700"]};
`;

const BackgroundWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  border: 0;

  isolation: isolate;
  overflow: clip;
`;

const ContentWrapper = styled.div<{ thinVerticalPadding?: boolean }>`
  padding: 24px;
  padding-top: ${(p) => (p.thinVerticalPadding ? "18px" : "24px")};
  padding-bottom: ${(p) => (p.thinVerticalPadding ? "18px" : "24px")};

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  flex: 1 0 0;

  z-index: 1;

  height: 100%;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px;
    gap: 16px;
  }
`;

const UpperCardStack = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

const Divider = styled.div`
  height: 1px;
  align-self: stretch;
  background: radial-gradient(
    50% 50% at 50% 50%,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0) 100%
  );
`;

const UpperCardTitleStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;
const InfoIcon = styled(II)`
  height: 20px;
  width: 20px;
`;

const InfoIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 24px;
  width: 24px;
`;
