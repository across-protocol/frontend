import styled from "@emotion/styled";
import { ReactComponent as ReferralIcon } from "assets/icons/rewards/referral-within-star.svg";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/external-link-12.svg";
import { ButtonV2 } from "components";
import { Link } from "react-router-dom";

type DisconnectedReferralBoxType = {
  connectHandler: () => void;
};

const DisconnectedReferralBox = ({
  connectHandler,
}: DisconnectedReferralBoxType) => (
  <Wrapper>
    <InnerWrapper>
      <IconTextWrapper>
        <ReferralIcon />
        <CTAText>
          Join the referral program and earn a portion of fees in ACX for
          transfers made from your unique referral link.
        </CTAText>
      </IconTextWrapper>
      <ButtonWrapper>
        <MoreInfoLink to={"/"}>
          Learn More <ExternalLinkIcon />
        </MoreInfoLink>
        <ConnectButton size="lg" onClick={connectHandler}>
          Connect to get started
        </ConnectButton>
      </ButtonWrapper>
    </InnerWrapper>
  </Wrapper>
);

export default DisconnectedReferralBox;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;

  background: #34353b;
  border: 1px solid #3e4047;
  border-radius: 12px;

  width: 100%;
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 48px;

  width: 100%;
`;

const IconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 24px;
`;

const CTAText = styled.p`
  width: 414px;

  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  color: #c5d5e0;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 24px;
`;

const ConnectButton = styled(ButtonV2)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  border: 1px solid #6cf9d8;
  border-radius: 20px;

  padding: 0 20px;

  background-color: transparent;

  height: 40px;
  width: fit-content;

  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #6cf9d8;
`;

const MoreInfoLink = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 6px;

  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #e0f3ff;

  text-decoration: none;

  & svg path {
    fill: #e0f3ff;
  }
`;
