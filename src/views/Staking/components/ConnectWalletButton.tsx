import styled from "@emotion/styled";
import { PrimaryButton } from "components/Button";
import { Text } from "components/Text";
import { useConnection } from "hooks";

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
              ? "stakeForm"
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

const Button = styled(PrimaryButton)`
  width: 100%;
`;
