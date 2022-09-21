import styled from "@emotion/styled";
import { ReactComponent as AcrossLogo } from "assets/icons/plaap/across-tiny.svg";
import { formatNumberMaxFracDigits } from "utils";
interface Props {
  Icon?: React.ReactElement;
  label: string;
  address: string;
  bottomText: string;
  amount: string;
}
const RewardsCard: React.FC<Props> = ({
  Icon,
  label,
  address,
  bottomText,
  amount,
}) => {
  return (
    <Wrapper>
      <TopRow>
        <EligibleWalletWrapper>
          <EligibleWallet>
            <IconContainer>{Icon}</IconContainer>
            <TextWrapper>
              <Label>{label}</Label>
              <Address>{address || "Wallet Address"}</Address>
            </TextWrapper>
          </EligibleWallet>
        </EligibleWalletWrapper>
        <TokenAmountWrapper>
          <TokenAmount>
            {formatNumberMaxFracDigits(Number(amount))} $ACX
          </TokenAmount>
          <AcrossLogo />
        </TokenAmountWrapper>
      </TopRow>
      <BottomRow>
        <BottomRowText>{bottomText}</BottomRowText>
      </BottomRow>
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

const EligibleWalletWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 42px;
  justify-content: center;
  align-items: center;
`;

const EligibleWallet = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  justify-content: center;
  align-items: flex-start;
`;

const IconContainer = styled.div`
  padding: 2px;
  border-radius: 50%;
  border: 1px solid #6cf9d8;

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

const Label = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;

  color: #9daab2;
`;

const Address = styled.p`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;

const TokenAmountWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  gap: 8px;
  height: 48px;

  background: #2d2e33;

  border: 1px solid #3e4047;
  border-radius: 8px;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TokenAmount = styled.h3`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #6cf9d8;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const BottomRow = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: center;
`;

const BottomRowText = styled.h3`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  color: #9daab2;
`;
