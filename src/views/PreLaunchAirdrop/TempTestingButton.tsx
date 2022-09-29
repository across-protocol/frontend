import { ButtonV2 } from "components";
import axios from "axios";
import { rewardsApiUrl } from "utils";
import { useState } from "react";

// This resets the dev wallet to ineligible state.
const TempTestingButton = () => {
  const [value, setValue] = useState("");
  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <label>Address</label>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <ButtonV2
        style={{ width: "200px", margin: "0 auto" }}
        size="md"
        onClick={() => {
          axios
            .patch(`${rewardsApiUrl}/airdrop/rewards/wallet-rewards`, {
              walletAddress: value,
              earlyUserRewards: "0",
              liquidityProviderRewards: "0",
              welcomeTravellerRewards: "0",
            })
            .then((res) => {
              console.log("success?", res);
              setValue("");
            });
        }}
      >
        Reset Dev Wallet (testing)
      </ButtonV2>
    </div>
  );
};

export default TempTestingButton;
