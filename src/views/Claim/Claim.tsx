import Footer from "components/Footer";

import { DisconnectedWallet } from "./components/DisconnectedWallet";
import { NotEligibleWallet } from "./components/NotEligibleWallet";
import { useClaimView } from "./hooks/useClaimView";

import { PageContainer, BodyContainer, Title } from "./Claim.styles";

export function Claim() {
  const { isConnected, connectWallet, eligibleState } = useClaimView();

  const isEligible =
    eligibleState.status === "success" && eligibleState.data.isEligible;

  return (
    <PageContainer>
      <BodyContainer>
        <Title>Airdrop</Title>
        {!isConnected ? (
          <DisconnectedWallet
            onClickConnect={connectWallet}
            isLoading={["loading"].includes(eligibleState.status)}
          />
        ) : !isEligible ? (
          <NotEligibleWallet />
        ) : null}
      </BodyContainer>
      <Footer />
    </PageContainer>
  );
}

export default Claim;
