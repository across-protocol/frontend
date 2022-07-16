import { Wrapper, ExternalLinkIcon } from "./RewardMediumBlock.styles";
import { mediumUrl } from "utils";

const RewardMediumBlock = () => {
  return (
    <Wrapper>
      <span>
        For a limited amount of time, all rewards from transfers will be
        increased by 3x.
      </span>
      <a href={mediumUrl} target="_blank" rel="noreferrer">
        Read more <ExternalLinkIcon />
      </a>
    </Wrapper>
  );
};

export default RewardMediumBlock;
