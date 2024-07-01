import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Modal } from "components";
import { SecondaryButton } from "components/Button";
import { Text } from "components/Text";
import {
  formatUnitsWithMaxFractions,
  QUERIESV2,
  rewardProgramTypes,
} from "utils";

import { useClaimModal } from "../hooks/useClaimModal";

type Props = {
  isOpen: boolean;
  onExit: () => void;
  program: rewardProgramTypes;
};

export function ClaimRewardsModal({ isOpen, onExit, program }: Props) {
  const { importTokenHandler, unclaimedProofsQuery, claimMutation, token } =
    useClaimModal(program);

  const disableButton =
    unclaimedProofsQuery.isLoading ||
    BigNumber.from(unclaimedProofsQuery.data?.claimableAmount ?? 0).isZero() ||
    claimMutation.isLoading;

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
      <ClaimableBoxInnerWrapper>
        <ClaimableBox>
          <Text size="lg" color="white-70">
            Claimable rewards
          </Text>
          <Text color="white-100">
            {unclaimedProofsQuery.isLoading ? (
              "Loading..."
            ) : (
              <IconText>
                {formatUnitsWithMaxFractions(
                  unclaimedProofsQuery.data?.claimableAmount || "0",
                  18
                ) + ` ${token.symbol}`}
                <Icon src={token.logoURI} />
              </IconText>
            )}
          </Text>
        </ClaimableBox>
        <Button
          size="lg"
          borderColor="yellow"
          onClick={() =>
            claimMutation.mutate(undefined, { onSuccess: () => onExit() })
          }
          disabled={disableButton}
        >
          {claimMutation.isLoading ? "Claiming..." : "Claim rewards"}
        </Button>
      </ClaimableBoxInnerWrapper>
      <AddToWalletWrapper>
        <Text size="md" color="white-70">
          Can't find the {token.symbol} token in your wallet? &nbsp;
        </Text>
        <AddToWalletLink onClick={importTokenHandler}>
          Click here to add it.
        </AddToWalletLink>
      </AddToWalletWrapper>
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

const ClaimableBoxInnerWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
`;

const Button = styled(SecondaryButton)`
  width: 100%;
`;

const AddToWalletWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: center;
  align-items: center;
  justify-content: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 8px;
  }
`;

const AddToWalletLink = styled(Text)`
  cursor: pointer;
`;

const Icon = styled.img`
  height: 16px;
  width: 16px;
`;

const IconText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
