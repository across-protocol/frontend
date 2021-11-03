import { FC } from "react";
import styled from "@emotion/styled";
import heroBg from "assets/hero-across-bg.png";
import BulletImg from "assets/Across-logo-bullet.svg";

const About: FC = () => {
  return (
    <Wrapper>
      <Hero>
        <HeroHeader>
          Instantly Send Assets from L2 Rollups to L1 Ethereum
        </HeroHeader>
      </Hero>
      <BodyWrapper>
        <BulletWrapper>
          <BulletImage src={BulletImg} alt="across_logo" />
          <BulletTextWrapper>
            <BulletHeader>Fast Transfers</BulletHeader>
            <BulletText>
              Lorem ipsum SEO sit amet, consectetur adipiscing elit. Sed vitae
              tristique erat. Maecenas suscipit commodo quam, vitae scelerisque
              elit vestibulum id.
              <br /> <br />
              Mauris sed magna tempor, feugiat elit placerat, sagittis urna.
              Suspendisse porttitor neque ex, et rutrum here is a link sed. Cras
              sodales nunc ac nunc.
            </BulletText>
          </BulletTextWrapper>
        </BulletWrapper>
        <BulletWrapper>
          <BulletImage src={BulletImg} alt="across_logo" />
          <BulletTextWrapper>
            <BulletHeader>Across different chains</BulletHeader>
            <BulletText>
              Cosectetur adipiscing SEO. Sed vitae tristique erat. Maecenas
              suscipit commodo quam, vitae scelerisque elit vestibulum id.
              <br /> <br />
              Mauris sed magna tempor, feugiat elit placerat, sagittis urna.
            </BulletText>
          </BulletTextWrapper>
        </BulletWrapper>
        <BulletWrapper>
          <BulletImage src={BulletImg} alt="across_logo" />
          <BulletTextWrapper>
            <BulletHeader>Secured by lorem ipsum</BulletHeader>
            <BulletText>
              Lorem SEO dolor sit amet, consectetur adipiscing elit. Sed vitae
              tristique erat. Maecenas suscipit commodo quam, vitae scelerisque
              elit vestibulum id.
              <br /> <br />
              Mauris sed magna tempor, feugiat elit placerat, sagittis urna.
              Suspendisse porttitor neque ex, et rutrum elit cursus sed. Cras
              sodales nunc ac nunc.
              <br /> <br />
              <Link
                href="https://umaproject.org"
                target="_blank"
                rel="noreferrer"
              >
                Here is a link
              </Link>
            </BulletText>
          </BulletTextWrapper>
        </BulletWrapper>
      </BodyWrapper>
    </Wrapper>
  );
};

const Hero = styled.div`
  background-image: url(${heroBg});
  min-height: 25vh;
  height: auto;
`;

const HeroHeader = styled.h1`
  color: hsla(166, 92%, 70%, 1);
  font-size: 3.5rem;
  font-weight: 700;
  font-family: "Barlow";
  line-height: 4.5rem;
  width: 80%;
  max-width: 800px;
  margin-left: 10vw;
  padding-top: 2.5rem;
`;

const Wrapper = styled.div``;

const BodyWrapper = styled.div`
  padding: 1.5rem;
`;

const Link = styled.a`
  font-family: "Barlow";
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

const BulletWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
  margin-bottom: 2rem;
`;

const BulletImage = styled.img`
  flex-basis: 20%;
  height: 35px;
  width: 35px;
`;

const BulletTextWrapper = styled.div`
  flex-basis: 50%;
`;

const BulletText = styled.h4`
  font-family: "Barlow";
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1rem;
  margin-bottom: 1rem;
`;

const BulletHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.5rem;
  font-family: "Barlow";
  margin-bottom: 1rem;
`;

export default About;
