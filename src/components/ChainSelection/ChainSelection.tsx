import React from "react";
import styled from "@emotion/styled";
import optimism from "../../assets/optimism.svg";
import { PrimaryButton as UnstyledButton } from "../BaseButton";
import { useOnboard } from "../../hooks";
import { useConnection } from "../../state/hooks";
import { switchToOptimism } from "../../utils/optimism";

const ChainSelection: React.FC = () => {
  const { provider, chainId, isConnected } = useConnection();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setError] = React.useState<Error | null>(null);
  const { init } = useOnboard();
  const isOnOptimism = chainId === 10;
  const actionText = isOnOptimism
    ? null
    : isConnected
    ? "Switch to Optimism"
    : "Connect Wallet";
  const handleClick = () => {
    if (!provider) {
      init();
    } else if (!isOnOptimism) {
      switchToOptimism(provider).catch(setError);
    }
  };

  return (
    <>
      <Heading>From</Heading>
      <Option>
        <Logo src={optimism} alt="optimism logo" />
        <span>Optimism</span>
      </Option>
      {!isOnOptimism && <Button onClick={handleClick}>{actionText}</Button>}
    </>
  );
};

export default ChainSelection;

const Button = styled(UnstyledButton)`
  width: 100%;
  font-size: ${18 / 16}rem;
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
`;
