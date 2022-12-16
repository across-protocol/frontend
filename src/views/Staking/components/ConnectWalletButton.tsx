import styled from "@emotion/styled";
import { ButtonV2 } from "components";
import { Text } from "components/Text";
import { useConnection } from "hooks";
import { QUERIESV2 } from "utils";

type ConnectWalletButtonParam = {
  reasonToConnect: "stake" | "unstake" | "claim rewards";
};

const ConnectWalletButton = ({ reasonToConnect }: ConnectWalletButtonParam) => {
  const { connect } = useConnection();

  return (
    <Button
      size="lg"
      onClick={() => {
        connect({
          trackSection:
            reasonToConnect === "stake"
              ? "stakeFrom"
              : reasonToConnect === "unstake"
              ? "unstakeForm"
              : "claimReferralRewardsForm",
        });
      }}
    >
      <Text color="dark-grey" size="lg" weight={500}>
        Connect wallet to {reasonToConnect}
      </Text>
    </Button>
  );
};

export default ConnectWalletButton;

const Button = styled(ButtonV2)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 40px;
  gap: 4px;

  width: 100%;
  height: 64px;

  background: #6cf9d8;
  border-radius: 32px;

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
    padding: 0px 20px;
  }
`;
