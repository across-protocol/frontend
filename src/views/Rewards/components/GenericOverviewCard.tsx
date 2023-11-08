import styled from "@emotion/styled";
import { COLORS } from "utils";
import { ReactComponent as Background } from "assets/bg-banners/overview-card-background.svg";
import { Text } from "components";

type GenericOverviewCardTitleProps = {
  subTitle: string;
  title: string;
};

type GenericOverviewCardProps = {
  Icon: React.FC;
  upperCard: GenericOverviewCardTitleProps;
  lowerCard: {
    left: GenericOverviewCardTitleProps;
    right: GenericOverviewCardTitleProps;
  };
};

const GenericOverviewCard = ({
  Icon,
  upperCard,
  lowerCard,
}: GenericOverviewCardProps) => (
  <Wrapper>
    <BackgroundWrapper>
      <Background />
    </BackgroundWrapper>
    <ContentWrapper>
      <UpperIconTextStack>
        <IconWrapper>
          <Icon />
        </IconWrapper>
        <UpperTextStack>
          <Text size="md" color="grey-400">
            {upperCard.subTitle}
          </Text>
          <Text size="2xl" color="white">
            {upperCard.title}
          </Text>
        </UpperTextStack>
      </UpperIconTextStack>
      <Divider />
      <BottomContentWrapper>
        <LowerTextStack>
          <Text color="grey-400" size="md">
            {lowerCard.left.subTitle}
          </Text>
          <Text color="white" size="md">
            {lowerCard.left.title}
          </Text>
        </LowerTextStack>
        <VerticalDivider />
        <LowerTextStack>
          <Text color="grey-400" size="md">
            {lowerCard.right.subTitle}
          </Text>
          <Text color="white" size="md">
            {lowerCard.right.title}
          </Text>
        </LowerTextStack>
      </BottomContentWrapper>
    </ContentWrapper>
  </Wrapper>
);

export default GenericOverviewCard;

const Wrapper = styled.div`
  // Layout
  display: flex;

  position: relative;
  overflow: clip;
  isolation: isolate;

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

const ContentWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  flex: 1 0 0;

  z-index: 1;

  height: 100%;
  width: 100%;
`;

const UpperIconTextStack = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  align-self: stretch;
`;

const UpperTextStack = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
`;

const LowerTextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1 0 0;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  flex-shrink: 0;

  width: 48px;
  height: 48px;
`;

const Divider = styled.div`
  width: calc(100% + 48px);
  margin-left: -24px;
  height: 1px;
  background: ${COLORS["grey-600"]};
`;

const VerticalDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${COLORS["grey-600"]};
`;

const BottomContentWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
`;
