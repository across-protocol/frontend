import { StyledWrapper, Link, Logo } from "./AcrossV4BannerStyles";
import Banner from "../Banner";

export function AcrossV4Banner() {
  return (
    <Banner type="success">
      <StyledWrapper>
        <div>
          <Logo />
          <span>Across V4 </span> is now live.
        </div>
        <Link
          href="https://across.to/blog/across-v4?utm_source=Website&utm_medium=App&utm_campaign=Across_V4"
          text="Learn more about the upgrade."
        />
      </StyledWrapper>
    </Banner>
  );
}
