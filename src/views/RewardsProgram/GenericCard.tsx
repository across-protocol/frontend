import styled from "@emotion/styled";
import { COLORS, QUERIESV2, rewardProgramTypes, rewardPrograms } from "utils";

type GenericCardProps = {
  program: rewardProgramTypes;
  children: React.ReactNode;
};

const GenericCard = ({ program, children }: GenericCardProps) => {
  const { primaryColor, backgroundUrl } = rewardPrograms[program];
  return (
    <Wrapper primaryColor={primaryColor} backgroundUrl={backgroundUrl}>
      {children}
    </Wrapper>
  );
};

export default GenericCard;

const Wrapper = styled.div<{ primaryColor: string; backgroundUrl: string }>`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1 0 0;
  flex-direction: column;
  align-self: stretch;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid
    ${({ primaryColor }) => COLORS[`${primaryColor}-15` as keyof typeof COLORS]};
  background: url(${({ backgroundUrl }) => backgroundUrl}) no-repeat;
  background-position: top;

  overflow: clip;

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
    align-self: stretch;
    padding: 16px;
  }
`;
