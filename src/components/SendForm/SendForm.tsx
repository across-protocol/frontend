import React from "react";

import {
  Section,
  AccentSection,
  SendWrapper,
  Info,
  SendButton,
} from "./SendForm.styles";
import ChainSelection from "../ChainSelection";
import CoinSelection from "../CoinSelection";
import AddressSelection from "../AddressSelection";
import { useConnection, useGlobal } from "state/hooks";
import type { Transfer } from "state/transfers";

type Props = {
  onSend: (transfer: Transfer) => void;
};

const SendForm: React.FC<Props> = ({ onSend }) => {
  const { isConnected } = useConnection();

  const { currentChainId } = useGlobal();

  // TODO: consider approvals and wrong network as well
  const isCorrectlyConnected = isConnected && currentChainId === 10;
  const disableButton = !isCorrectlyConnected;

  const buttonMsg = isConnected ? "Send" : "Connect Wallet";

  const handleSend = () => {
    console.log(`Sending assets...`);
  };
  return (
    <>
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

          <SendButton disabled={disableButton} onClick={handleSend}>
            {buttonMsg}
          </SendButton>
        </SendWrapper>
      </AccentSection>
    </>
  );
};

export default SendForm;
