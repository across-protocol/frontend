import { DisconnectedWallet } from "./components/DisconnectedWallet";
import { NotEligibleWallet } from "./components/NotEligibleWallet";
import { useClaimView } from "./hooks/useClaimView";

import { Wrapper, Title } from "./Claim.styles";

export function Claim() {
  const { isConnected, connectWallet, eligibleState } = useClaimView();

  const isEligible =
    eligibleState.status === "success" && eligibleState.isEligible;

  return (
    <Wrapper>
      <Title>Airdrop</Title>
      {!isConnected ? (
        <DisconnectedWallet
          onClickConnect={connectWallet}
          isLoading={["loading"].includes(eligibleState.status)}
        />
      ) : !isEligible ? (
        <NotEligibleWallet />
      ) : null}
    </Wrapper>
  );
}

export default Claim;
