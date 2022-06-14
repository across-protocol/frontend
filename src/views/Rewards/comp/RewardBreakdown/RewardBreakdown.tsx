import {
  RewardBreakdownSection,
  RewardBlockWrapper,
  RewardBlockItem,
  RewardsDollarSignLogo,
  BreakdownButton,
  RewardBlockItemTopRow,
  RewardBlockBottomRow,
  RewardAmountLarge,
  RewardAmountSmall,
} from "./RewardBreakdown.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const RewardBreakdown = () => {
  return (
    <RewardBreakdownSection>
      <RewardBlockWrapper>
        <RewardBlockItem>
          <RewardBlockItemTopRow>
            <div>
              <RewardsDollarSignLogo /> <span>ACX Rewards</span>
            </div>
            <div>
              <BreakdownButton>
                <div>
                  Breakdown
                  <FontAwesomeIcon icon={faChevronRight} />
                </div>
              </BreakdownButton>
            </div>
          </RewardBlockItemTopRow>
          <RewardBlockBottomRow>
            <RewardAmountLarge>$321.24</RewardAmountLarge>
            <RewardAmountSmall>82.431 ACX</RewardAmountSmall>
          </RewardBlockBottomRow>
        </RewardBlockItem>
        <RewardBlockItem>
          <RewardBlockItemTopRow>
            <div>
              <RewardsDollarSignLogo /> <span>Staked LP Tokens</span>
            </div>
            <div>
              <RewardsDollarSignLogo />
            </div>
          </RewardBlockItemTopRow>
          <RewardBlockBottomRow>
            <RewardAmountLarge>$15.125.54</RewardAmountLarge>
            <RewardAmountSmall>12,142.24 USDC, 1.2424 ETH +1</RewardAmountSmall>
          </RewardBlockBottomRow>
        </RewardBlockItem>
      </RewardBlockWrapper>
    </RewardBreakdownSection>
  );
};

export default RewardBreakdown;
