import styled from "@emotion/styled";

interface Props {
  Icon?: React.ReactElement;
  subHeader: string;
  title: string;
}
const RewardsCard: React.FC<Props> = ({ Icon, subHeader, title }) => {
  return (
    <Wrapper>
      <ProgressIconTextWrapper>
        <StepIconTextWrapper>
          <CustomIconContainer>{Icon}</CustomIconContainer>
          <TextWrapper>
            <TextSubHeader>{subHeader}</TextSubHeader>
            <TextHeader>{title}</TextHeader>
          </TextWrapper>
        </StepIconTextWrapper>
      </ProgressIconTextWrapper>
    </Wrapper>
  );
};

export default RewardsCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 18px;
  padding-top: 32px;

  background-color: #34353b;

  &:before {
    content: "";
    background-color: #34353b;
    position: absolute;
    height: 200%;
    width: 300%;
    left: -100%;
    z-index: -1;
    top: 0;
  }
`;

const ProgressIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 42px;
  justify-content: center;
  align-items: center;
`;

const IconWrapper = styled.div`
  position: relative;
`;

const StepIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  justify-content: center;
  align-items: flex-start;
`;

const CustomIconContainer = styled.div`
  padding: 2px;
  border-radius: 50%;

  height: 46px;
  width: 46px;

  & img {
    height: 40px;
    width: 40px;
  }
  & svg {
    height: 40px;
    width: 40px;
  }
`;

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  justify-content: space-between;

  width: 100%;
`;

const TextSubHeader = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;

  color: #9daab2;
`;

const TextHeader = styled.p`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;
