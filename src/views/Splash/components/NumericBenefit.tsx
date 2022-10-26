import styled from "@emotion/styled";
import { Text } from "components/Text";

type NumericBenefitProp = {
  title: string;
  value: string;
};

const NumericBenefit = ({ title, value }: NumericBenefitProp) => {
  return (
    <Wrapper>
      <Text size="3.5xl" color="white-100">
        {value}
      </Text>
      <TitleText>{title}</TitleText>
    </Wrapper>
  );
};

export default NumericBenefit;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const TitleText = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  text-align: center;

  color: #9daab2;
`;
