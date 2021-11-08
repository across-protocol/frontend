import { FC } from "react";
import styled from "@emotion/styled";
import heroBg from "assets/hero-across-bg.png";
import BulletImg from "assets/Across-logo-bullet.svg";

const About: FC = () => {
  return (
    <Wrapper>
      <HeroBg>
        <HeroHeader>
          Instantly Send Assets from Layer 2 Rollups to Ethereum
        </HeroHeader>
      </HeroBg>
      <Body>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>Instantaneous Liquidity</BulletHeader>
            <BulletText>
              Assets are bridged and available for use on mainnet almost
              instantly.
            </BulletText>
          </TextWrapper>
        </Bullet>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>Secure</BulletHeader>
            <BulletText>
              Powered By UMA protocol. Transfers are secured by UMA's Optimistic Oracle,
              which is audited by OpenZeppelin and trusted by top teams to
              protect hundreds of millions of dollars in value.
            </BulletText>
          </TextWrapper>
        </Bullet>
        <Bullet>
          <Image src={BulletImg} alt="across_logo" />
          <TextWrapper>
            <BulletHeader>Cheap</BulletHeader>
            <BulletText>
              Relayers and liquidity providers are compensated with fees from
              users initiating transfers, but this fee is less than any other
              solution on the market.
            </BulletText>
            <Link
              href="https://across.gitbook.io/bridge/"
              target="_blank"
              rel="noreferrer"
            >
              Read more
            </Link>
          </TextWrapper>
        </Bullet>
      </Body>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  --horinzontal-padding: 75px;
  --heroHeight: 240px;
  height: calc(100% - var(--heroHeight));
  padding: 0 var(--horinzontal-padding);
`;
const HeroBg = styled.div`
  background-image: url(${heroBg});
  background-size: cover;
  background-repeat: no-repeat;
  padding: 0 var(--horinzontal-padding);
  margin: 0 calc(-1 * var(--horinzontal-padding));
  display: flex;
  align-items: center;
  height: var(--heroHeight);
`;

const HeroHeader = styled.h1`
  color: var(--color-primary);
  font-size: ${56 / 16}rem;
  font-weight: 700;
  line-height: 1.28;
  max-width: 1000px;
`;

const Body = styled.section`
  padding: 55px 0 65px;
`;

const Link = styled.a`
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1rem;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  text-decoration: underline;
  color: var(--color-primary);
  &:hover {
    cursor: pointer;
  }
`;

const Bullet = styled.article`
  display: flex;
  align-items: flex-start;
  &:not(:first-of-type) {
    margin-top: 64px;
  }
`;

const Image = styled.img`
  height: 35px;
  width: 35px;
  object-fit: cover;
  margin-right: 45px;
`;

const TextWrapper = styled.div``;

const BulletText = styled.p`
  max-width: 65ch;
`;

const BulletHeader = styled.h4`
  font-size: ${30 / 16}rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 14px;
  transform: translateY(-5px);
`;

export default About;
