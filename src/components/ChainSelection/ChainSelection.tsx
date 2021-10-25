import React from "react";
import { useOnboard } from "hooks";
import { useConnection, useSend } from "state/hooks";
import { CHAINS, switchChain } from "utils";
import { Section, SectionTitle } from "../Section";
import {
  Wrapper,
  RoundBox,
  Logo,
  ConnectButton,
} from "./ChainSelection.styles";

const ChainSelection: React.FC = () => {
  const { init } = useOnboard();
  const { isConnected, provider } = useConnection();
  const { hasToSwitchChain, fromChain } = useSend();

  const buttonText = hasToSwitchChain
    ? `Switch to ${CHAINS[fromChain].name}`
    : !isConnected
    ? "Connect Wallet"
    : null;

  const handleClick = () => {
    if (!provider) {
      init();
    } else if (hasToSwitchChain) {
      switchChain(provider, fromChain);
    }
  };

  return (
    <Section>
      <Wrapper>
        <SectionTitle>From</SectionTitle>
        <RoundBox>
          <Logo
            src={CHAINS[fromChain].logoURI}
            alt={`${CHAINS[fromChain].name}`}
          />
          <span>{CHAINS[fromChain].name}</span>
        </RoundBox>
        {(hasToSwitchChain || !isConnected) && (
          <ConnectButton onClick={handleClick}>{buttonText}</ConnectButton>
        )}
      </Wrapper>
    </Section>
  );
};
export default ChainSelection;
