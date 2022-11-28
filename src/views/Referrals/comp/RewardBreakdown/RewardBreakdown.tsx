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
  InfoButtonRow,
  InfoButton,
  AllQuestionsButton,
} from "./RewardBreakdown.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const RewardBreakdown = () => {
  return (
    <>
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
              <RewardAmountSmall>
                12,142.24 USDC, 1.2424 ETH +1
              </RewardAmountSmall>
            </RewardBlockBottomRow>
          </RewardBlockItem>
        </RewardBlockWrapper>
      </RewardBreakdownSection>
      {/* Note: these will be links. Design / PM to provide links later. */}
      <InfoButtonRow>
        <InfoButton>
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>How do I earn more ACX?</span>
        </InfoButton>
        <InfoButton>
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>How do multipliers work?</span>
        </InfoButton>
        <InfoButton>
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>How is the reward APY calculated?</span>
        </InfoButton>
        <AllQuestionsButton>
          <span>All questions</span>
          <FontAwesomeIcon icon={faChevronRight} />
        </AllQuestionsButton>
      </InfoButtonRow>
    </>
  );
};

export default RewardBreakdown;
