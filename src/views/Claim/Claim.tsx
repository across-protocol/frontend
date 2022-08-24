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
    handleAddTokenToWallet,
    alreadyClaimed,
    claimState,
  } = useClaimView();

  const isEligible = !isEligibleQuery.isLoading && isEligibleQuery.data;

  const activeClaimStepIndex = alreadyClaimed ? 1 : 0;

  return (
    <PageContainer>
      <BodyContainer>
        <Title>Airdrop</Title>
        {!isConnected || isEligibleQuery.isLoading ? (
          <DisconnectedWallet
            onClickConnect={handleConnectWallet}
            isCheckingEligibility={isEligibleQuery.isLoading}
          />
        ) : !isEligible ? (
          <NotEligibleWallet />
        ) : (
          <EligibleWallet
            onClickClaim={handleClaim}
            claimable={claimableTokensQuery.data}
            activeStepIndex={activeClaimStepIndex}
            onClickAddToken={handleAddTokenToWallet}
            isClaiming={claimState.status.includes("pending")}
          />
        )}
      </BodyContainer>
      <Footer />
    </PageContainer>
  );
}

export default Claim;
