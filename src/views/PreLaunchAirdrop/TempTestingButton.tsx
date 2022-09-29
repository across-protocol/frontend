import { ButtonV2 } from "components";
import axios from "axios";
import { rewardsApiUrl } from "utils";
const TempTestingButton = () => {
  return (
    <ButtonV2
      style={{ width: "200px", margin: "0 auto" }}
      size="md"
      onClick={() => {
        axios
          .patch(`${rewardsApiUrl}/airdrop/rewards/wallet-rewards`, {
            walletAddress: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
            earlyUserRewards: "0",
            liquidityProviderRewards: "0",
            welcomeTravellerRewards: "0",
          })
          .then((res) => {
            console.log("success?", res);
          });
      }}
    >
      Reset Dev Wallet (testing)
    </ButtonV2>
  );
};

export default TempTestingButton;
