import styled from "@emotion/styled";
import { QUERIESV2, BREAKPOINTS_V2 } from "utils/constants";
import { shortenAddress } from "utils";
import useWindowSize from "hooks/useWindowsSize";

interface Props {
  Icon?: React.ReactElement;
  label: string;
  address: string;
  bottomText: string;
}
const RewardsCard: React.FC<Props> = ({ Icon, label, address, bottomText }) => {
  const { width = 0 } = useWindowSize();
  const isMobile = width < BREAKPOINTS_V2.sm;

  return (
    <Wrapper>
      <TopRow>
        <EligibleWalletWrapper>
          <EligibleWallet>
            <IconContainer>{Icon}</IconContainer>
            <TextWrapper>
              <Label>{label}</Label>
              <Address>
                {isMobile
                  ? shortenAddress(address, "...", 15)
                  : address || "Wallet Address"}
              </Address>
            </TextWrapper>
          </EligibleWallet>
        </EligibleWalletWrapper>
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
  gap: 32px;
  background-color: #34353b;
  padding-top: 32px;

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

  @media ${QUERIESV2.sm.andDown} {
    padding-left: 0;
    padding-top: 24px;
    gap: 24px;
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

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: column;
  }
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

  color: #6cf9d8;
`;

const Address = styled.p`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const BottomRow = styled.div`
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
