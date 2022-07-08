import { Wrapper } from "./RewardMediumBlock.styles";
import { mediumUrl } from "utils";

const RewardMediumBlock = () => {
  return (
    <Wrapper>
      <div>
        <span>
          For a limited amount of time, all rewards from transfers will be
          increased by 4x.
        </span>
        <span>
          <a href={mediumUrl} target="_blank" rel="noreferrer">
            {" "}
            Read more
          </a>
        </span>
      </div>
    </Wrapper>
  );
};

export default RewardMediumBlock;
