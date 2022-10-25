import { FC } from "react";
import styled from "@emotion/styled";
import heroBg from "assets/hero-across-bg.png";
import BulletImg from "assets/Across-logo-bullet.svg";
import { ReactComponent as UnstyledUmaLogo } from "assets/Across-Powered-UMA.svg";
import { COLORS, QUERIES } from "utils";

const NAV_LINKS = [
  {
    name: "Read our articles on Medium",
    url: "https://medium.com/across-protocol",
  },
  {
    name: "Stay up to date on our Twitter",
    url: "https://twitter.com/AcrossProtocol",
  },
  {
    name: "Deep dive into our docs site",
    url: "https://docs.across.to/v2",
  },
];

const About: FC = () => {
  return (
    <Wrapper>
      <HeroBg>
        <HeroHeader>What is Across?</HeroHeader>
        <HeroSubheader>
          A cross-chain bridging solution that supports fast, secure and
          cost-efficient transfers.
        </HeroSubheader>
      </HeroBg>
      <Body>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>FAST</BulletHeader>
            <BulletText>
              Using Across means that assets are bridged and available for use
              on mainnet and L2s almost instantly. You can typically expect to
              receive your funds within 1-2 minutes.
              <br />
              <br />
              You can learn more about how Across protocol executes
              near-instantaneous transfers{" "}
              <Link
                href="https://medium.com/across-protocol/how-is-across-protocol-so-fast-d77b4e7481c9"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
              .
            </BulletText>
          </TextWrapper>
        </Bullet>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>SECURE</BulletHeader>
            <BulletText>
              Secured by UMA's optimistic oracle. This optimistic oracle has
              been audited by OpenZeppelin and is trusted by top teams to
              protect hundreds of millions of dollars in value.
              <br />
              <br />
              Across` contracts have also been audited by OpenZeppelin. Our
              bridge's smart contracts have been extensively tested — proven by
              our audits, TVL in Across` bridge and our contracts standing the
              test of time.
              <br />
              <br />
              You can read more about our security{" "}
              <Link
                href="https://medium.com/across-protocol/a-deep-dive-into-across-protocols-security-c9b46a217b3b"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
              .
            </BulletText>
          </TextWrapper>
        </Bullet>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>COST-EFFICIENT</BulletHeader>
            <BulletText>
              Across Protocol is highly cost-efficient.
              <br />
              <br />
              Especially for large transfers, Across is the cheapest cross-chain
              bridge in regards to fees.
              <br />
              <br />
              Across does not use AMMs to transfer funds between chains. This
              means <b>slippage-free transfers</b>.
              <br />
              <br />
              You can read more about our low fees{" "}
              <Link
                href="https://medium.com/across-protocol/how-does-across-protocol-bridgeforless-2b972d7d9c85"
                target="_blank"
                rel="noreferrer"
              >
                here
              </Link>
              .
            </BulletText>
          </TextWrapper>
        </Bullet>
      </Body>
      <Footer>
        <NavLinks>
          {NAV_LINKS.map((link) => (
            <FooterLink
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.name}
            </FooterLink>
          ))}
        </NavLinks>
        <UmaLink
          href="https://umaproject.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PoweredByUMA />
        </UmaLink>
      </Footer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  --horinzontal-padding: 20px;
  --heroHeight: 180px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 var(--horinzontal-padding);
  @media ${QUERIES.tabletAndUp} {
    --horizontal-padding: 50px;
    --heroHeight: 200px;
  }
  @media ${QUERIES.desktopAndUp} {
    --horinzontal-padding: 75px;
    --heroHeight: 240px;
  }
`;
const HeroBg = styled.div`
  flex-basis: var(--heroHeight);
  background-image: url(${heroBg});
  background-size: cover;
  background-repeat: no-repeat;
  padding: 0 var(--horinzontal-padding);
  margin: 0 calc(-1 * var(--horinzontal-padding));
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: var(--heroHeight);
`;

const HeroHeader = styled.h1`
  margin: 0 0 1rem;
  display: block;
  color: var(--color-primary);
  // will change the font from 24px to 56px fluidly
  font-size: clamp(1.5rem, 2.9vw + 1rem, 3.5rem);
  font-weight: 700;
  line-height: 1.28;
  max-width: 65ch;
  @media ${QUERIES.tabletAndUp} {
    max-width: 1000px;
  }
`;

const Body = styled.section`
  flex: 1;
  padding: 15px 0 50px;
  @media ${QUERIES.tabletAndUp} {
    padding: 55px 0 65px;
  }
`;

const Link = styled.a`
  display: inline-block;
  font-size: ${16 / 16}rem;
  margin: 0;
  text-decoration: underline;
  color: var(--color-primary);
  transition: color 100ms linear;
  &:hover {
    cursor: pointer;
    color: var(--color-primary-transparent);
  }
`;

const Bullet = styled.article`
  --bulletMarginTop: 32px;
  display: flex;
  align-items: flex-start;
  &:not(:first-of-type) {
    margin-top: var(--bulletMarginTop);
  }
  @media ${QUERIES.tabletAndUp} {
    --bulletMarginTop: 64px;
  }
`;

const Image = styled.img`
  height: 35px;
  width: 35px;
  object-fit: cover;
  margin-right: 45px;
  margin-top: -5px;
  display: none;
  @media ${QUERIES.laptopAndUp} {
    display: revert;
  }
`;

const TextWrapper = styled.div``;

const BulletText = styled.p`
  max-width: 65ch;
`;

const BulletHeader = styled.h4`
  font-size: ${20 / 16}rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
  transform: translateY(-5px);
  @media ${QUERIES.tabletAndUp} {
    font-size: ${30 / 16}rem;
    margin-bottom: 14px;
  }
`;

const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: auto;
  padding: 35px 0;
  color: hsla(${COLORS.white} / 0.5);
  border-top: 1px solid currentColor;

  @media ${QUERIES.tabletAndUp} {
    flex-direction: row;
  }
`;

const FooterLink = styled.a`
  display: block;
  font-size: ${15 / 16}rem;
  color: inherit;
  text-decoration: none;
  transition: color 100ms linear;

  &:not(:last-of-type) {
    margin-bottom: 15px;
  }

  &:hover {
    color: var(--color-white);
  }

  @media ${QUERIES.tabletAndUp} {
    font-size: ${16 / 16}rem;

    &:not(:last-of-type) {
      margin-bottom: 20px;
    }
  }
`;

const NavLinks = styled.div``;

const UmaLink = styled(FooterLink)`
  margin: 45px 0 0;

  &:hover {
    color: var(--color-uma-red);
  }

  @media ${QUERIES.tabletAndUp} {
    margin: 0;
  }
`;

const PoweredByUMA = styled(UnstyledUmaLogo)`
  fill: currentColor;

  transition: fill linear 100ms;
  & path {
    fill: currentColor;
  }
`;

const HeroSubheader = styled.p`
  font-size: ${16 / 16}rem;

  @media ${QUERIES.tabletAndUp} {
    font-size: ${18 / 16}rem;
  }
`;

export default About;
