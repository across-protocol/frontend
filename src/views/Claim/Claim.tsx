import Footer from "components/Footer";

import { DisconnectedWallet } from "./components/DisconnectedWallet";
import { NotEligibleWallet } from "./components/NotEligibleWallet";
import { EligibleWallet } from "./components/EligibleWallet";
import { useClaimView } from "./hooks/useClaimView";

import { PageContainer, BodyContainer, Title } from "./Claim.styles";

export function Claim() {
  const {
    isConnected,
    isEligibleQuery,
    claimableTokensQuery,
    handleClaim,
    handleConnectWallet,
  } = useClaimView();

  const isEligible = !isEligibleQuery.isLoading && isEligibleQuery.data;

  const activeClaimStepIndex = 0;

  return (
    <PageContainer>
      <BodyContainer>
        <Title>Airdrop</Title>
        {!isConnected ? (
          <DisconnectedWallet
            onClickConnect={handleConnectWallet}
            isLoading={isEligibleQuery.isLoading}
          />
        ) : !isEligible ? (
          <NotEligibleWallet />
        ) : (
          <EligibleWallet
            onClickClaim={handleClaim}
            claimable={claimableTokensQuery.data}
            activeStepIndex={activeClaimStepIndex}
          />
        )}
      </BodyContainer>
      <Footer />
    </PageContainer>
  );
}

export default Claim;
