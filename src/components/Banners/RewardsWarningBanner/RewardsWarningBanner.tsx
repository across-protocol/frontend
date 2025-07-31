import Banner from "../Banner";
import { Wrapper } from "../Banner/Banner.styles";
import { ReactComponent as InfoLogo } from "assets/icons/info.svg";

export function RewardsWarningBanner() {
  return (
    <Banner>
      <Wrapper>
        <InfoLogo />
        <span>
          Due to maintenance, rewards will not be visually updated for a few
          hours. This does not impact your reward earnings.
        </span>
      </Wrapper>
    </Banner>
  );
}
