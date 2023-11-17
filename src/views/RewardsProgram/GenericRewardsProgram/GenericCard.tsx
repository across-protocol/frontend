import styled from "@emotion/styled";
import { COLORS, QUERIESV2, rewardProgramTypes, rewardPrograms } from "utils";
import DefaultBanner from "assets/bg-banners/default-banner.svg";

type GenericCardProps = {
  program: rewardProgramTypes;
  children: React.ReactNode;
  displayBranding?: boolean;
};

const GenericCard = ({
  program,
  children,
  displayBranding = false,
}: GenericCardProps) => {
  const { primaryColor, backgroundUrl: brandingUrl } = rewardPrograms[program];
  const backgroundUrl = displayBranding ? brandingUrl : DefaultBanner;
  return (
    <Wrapper primaryColor={primaryColor} displayBranding={displayBranding}>
      <BackgroundLayer>
        <BackgroundImage src={backgroundUrl} />
      </BackgroundLayer>
      <ContentWrapper>{children}</ContentWrapper>
    </Wrapper>
  );
};

export default GenericCard;

const Wrapper = styled.div<{ primaryColor: string; displayBranding: boolean }>`
  display: flex;
  width: 100%;
  height: 100%;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid
    ${({ primaryColor, displayBranding }) =>
      COLORS[
        displayBranding
          ? (`${primaryColor}-15` as keyof typeof COLORS)
          : "grey-600"
      ]};
  background: linear-gradient(
    90deg,
    ${({ primaryColor, displayBranding }) =>
        COLORS[
          displayBranding
            ? (`${primaryColor}-5` as keyof typeof COLORS)
            : "black-700"
        ]}
      0%,
    ${({ primaryColor, displayBranding }) =>
        COLORS[
          displayBranding
            ? (`${primaryColor}-0` as keyof typeof COLORS)
            : "black-700"
        ]}
      100%
  );

  overflow: clip;
  isolation: isolate;
  position: relative;

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
    align-self: stretch;
    padding: 16px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1 0 0;
  flex-direction: column;
  align-self: stretch;

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
  }
  z-index: 1;
`;

const BackgroundLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
`;

const BackgroundImage = styled.img`
  width: calc(100% + 24px);
  height: 100%;
`;
