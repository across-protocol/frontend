import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Alert, ButtonV2, Modal } from "components";
import { Text } from "components/Text";
import { formatEther } from "utils";

import { useClaimModal } from "../hooks/useClaimModal";
import { tiers } from "../comp/RewardReferral/RewardReferral";

type Props = {
  isOpen: boolean;
  onExit: () => void;
};

export function ClaimRewardsModal({ isOpen, onExit }: Props) {
  const { claimMutation, unclaimedReferralProofsQuery } = useClaimModal();

  const disableButton =
    unclaimedReferralProofsQuery.isLoading ||
    claimMutation.isLoading ||
    (
      unclaimedReferralProofsQuery.data?.claimableAmount || BigNumber.from(0)
    ).isZero();

  return (
    <Modal
      isOpen={isOpen}
      title="Referral rewards"
      exitModalHandler={onExit}
      width={550}
      height={400}
      exitOnOutsideClick
      disableExitOverride={false}
      verticalLocation={{
        tablet: "bottom",
        mobile: "bottom",
      }}
    >
      <Alert status="warn">
        Claiming your ACX will reset your tier to Copper and referral rate to
        {tiers[1].referralRate * 100}%.
      </Alert>
      <ClaimableBox>
        <Text size="lg" color="white-70">
          Claimable rewards
        </Text>
        <Text color="white-100">
          {unclaimedReferralProofsQuery.isLoading
            ? "Loading..."
            : `${formatEther(
                unclaimedReferralProofsQuery.data?.claimableAmount || "0"
              )} ACX`}
        </Text>
      </ClaimableBox>
      <Button
        size="lg"
        onClick={() => claimMutation.mutate()}
        disabled={disableButton}
      >
        <Text color="warning" size="lg">
          {claimMutation.isLoading ? "Claiming..." : "Claim rewards"}
        </Text>
      </Button>
    </Modal>
  );
}

const ClaimableBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border: 1px solid #3e4047;
  border-radius: 12px;
`;

const Button = styled(ButtonV2)`
  width: 100%;
  border: 1px solid #f9d26c;
  background-color: transparent;
`;
