import React from "react";
import styled from "@emotion/styled";
import { PrimaryButton as UnstyledButton } from "../BaseButton";
import { useOnboard } from "hooks";
import { useGlobal, useSelectedSendArgs, useConnection } from "state/hooks";
import { CHAINS, networkFromChainId, switchToChain } from "utils";

const ChainSelection: React.FC = () => {
  const { isConnected, provider } = useConnection();
  const { currentChainId } = useGlobal();
  const { fromChain } = useSelectedSendArgs();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setError] = React.useState<Error | null>(null);
  const { init } = useOnboard();
  const isOnCorrectChain = currentChainId === fromChain;
  const actionText = isOnCorrectChain
    ? null
    : isConnected
    ? `Switch to ${networkFromChainId(fromChain)}`
    : "Connect Wallet";
  const handleClick = () => {
    if (!provider) {
      init();
    } else if (!isOnCorrectChain) {
      switchToChain(provider, fromChain).catch(setError);
    }
  };

  return (
    <>
      <Heading>From</Heading>
      <Option>
        <Logo
          src={CHAINS[fromChain].logoURI}
          alt={`${CHAINS[fromChain].name}`}
        />
        <span>{networkFromChainId(fromChain)}</span>
      </Option>
      {!isOnCorrectChain && <Button onClick={handleClick}>{actionText}</Button>}
    </>
  );
};

export default ChainSelection;

const Button = styled(UnstyledButton)`
  width: 100%;
  font-size: ${18 / 16}rem;
  text-transform: capitalize;
`;

const Heading = styled.h3`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 16px;
`;
const Logo = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 20px;
`;
const Option = styled.div`
  padding: 15px 20px;
  border-radius: 32px;
  background-color: var(--gray-light);
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  text-transform: capitalize;
`;
