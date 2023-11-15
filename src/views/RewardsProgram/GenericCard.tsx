import styled from "@emotion/styled";
import { COLORS, QUERIESV2, rewardProgramTypes, rewardPrograms } from "utils";

type GenericCardProps = {
  program: rewardProgramTypes;
  children: React.ReactNode;
};

const GenericCard = ({ program, children }: GenericCardProps) => {
  const { primaryColor, backgroundUrl } = rewardPrograms[program];
  return (
    <Wrapper primaryColor={primaryColor}>
      <BackgroundLayer>
        <BackgroundImage src={backgroundUrl} />
      </BackgroundLayer>
      <ContentWrapper>{children}</ContentWrapper>
    </Wrapper>
  );
};

export default GenericCard;

const Wrapper = styled.div<{ primaryColor: string; transparentFade?: boolean }>`
  display: flex;
  width: 100%;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid
    ${({ primaryColor }) => COLORS[`${primaryColor}-15` as keyof typeof COLORS]};
  background: linear-gradient(
    90deg,
    ${({ primaryColor }) => COLORS[`${primaryColor}-5` as keyof typeof COLORS]}
      0%,
    ${({ primaryColor }) => COLORS[`${primaryColor}-0` as keyof typeof COLORS]}
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
