import {
  Wrapper,
  RewardBreakdownSection,
  RewardBlockWrapper,
  RewardBlockItem,
  RewardsDollarSignLogo,
  BreakdownButton,
  RewardBlockItemTopRow,
} from "./Rewards.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const Rewards = () => {
  return (
    <Wrapper>
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
          </RewardBlockItem>
          <RewardBlockItem>
            <RewardsDollarSignLogo />
          </RewardBlockItem>
        </RewardBlockWrapper>
      </RewardBreakdownSection>
    </Wrapper>
  );
};

export default Rewards;
