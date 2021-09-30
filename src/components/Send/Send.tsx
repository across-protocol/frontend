import React from "react";
import styled from "@emotion/styled";
import MaxWidthWrapper from "../MaxWidthWrapper";
import ChainSelection from "../ChainSelection";
import CoinSelection from "../CoinSelection";
import AddressSelection from "../AddressSelection";
import { PrimaryButton } from "../BaseButton";
import { useConnection } from "../../state/hooks";

const Send = () => {
  const { isConnected } = useConnection();
  // TODO: consider approvals and wrong network as well
  const disableButton = !isConnected;
  const buttonMsg = isConnected ? "Send" : "Connect Wallet";
  return (
    <MaxWidth size="sm">
      <Wrapper>
        <Section>
          <ChainSelection />
        </Section>
        <Section>
          <CoinSelection />
        </Section>
        <Section>
          <AddressSelection />
        </Section>
        <AccentSection>
          <SendWrapper>
            <Info>
              <div>Time to Ethereum Mainnet</div>
              <div>~1-3 minutes</div>
            </Info>
            <Info>
              <div>Bridge Fee</div>
              <div>0.05 UMA</div>
            </Info>
            <Info>
              <div>You will get</div>
              <div>90.00 UMA</div>
            </Info>

            <SendButton disabled={disableButton}>{buttonMsg}</SendButton>
          </SendWrapper>
        </AccentSection>
      </Wrapper>
    </MaxWidth>
  );
};

const MaxWidth = styled(MaxWidthWrapper)`
  height: 100%;
`;
const Wrapper = styled.section`
  background-color: var(--gray);
  color: var(--white);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Section = styled.section`
  border-bottom: 1px solid var(--primary-dark);
  padding: 35px 30px;
`;
const AccentSection = styled(Section)`
  background-image: linear-gradient(var(--primary-dark), var(--gray));
  color: var(--transparent-white);
  border-right: 1px solid var(--gray);
  border-left: 1px solid var(--gray);
  font-size: ${16 / 16}rem;
  flex: 1;
`;

const SendButton = styled(PrimaryButton)`
  font-size: ${22 / 16}rem;
  font-weight: bold;
`;

const SendWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Info = styled.div`
  display: flex;
  justify-content: space-between;

  &:not(:last-of-type) {
    margin-bottom: 16px;
  }
  &:last-of-type {
    margin-bottom: 32px;
  }
`;

export default Send;
