import styled from "@emotion/styled";
import VideoBackground from "assets/prelaunch/acx-bg-video-comp.mp4";
import { ReactComponent as Megaphone } from "assets/icons/megaphone-24.svg";
import { ReactComponent as ChevronRight } from "assets/icons/arrow-right-16.svg";
import { QUERIESV2 } from "utils";
import { Link } from "react-router-dom";

const ACXLiveBanner = () => (
  <Wrapper>
    <BackgroundLayer autoPlay loop muted>
      <source src={VideoBackground} type="video/mp4" />
    </BackgroundLayer>
    <OpacityLayer />
    <ContentWrapper>
      <AnnouncementWrapper>
        <StyledMegaphone />
        <DesktopAnnouncement>
          We're excited to announce that the{" "}
          <GradientText>ACX token is live.</GradientText>
        </DesktopAnnouncement>
        <MobileAnnouncement>
          <GradientText>The ACX token is live.</GradientText>
        </MobileAnnouncement>
      </AnnouncementWrapper>
      <ButtonWrapper>
        Check eligibility{" "}
        <StyledButton to="/airdrop">
          <ChevronRight />
        </StyledButton>
      </ButtonWrapper>
    </ContentWrapper>
  </Wrapper>
);

export default ACXLiveBanner;

const DesktopAnnouncement = styled.div`
  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;

const MobileAnnouncement = styled.div`
  display: none;
  @media ${QUERIESV2.sm.andDown} {
    display: block;
  }
`;

const AnnouncementWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;

  color: #e0f3ff;
`;

const ButtonWrapper = styled(AnnouncementWrapper)`
  gap: 16px;
  color: #e0f3ff;
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  z-index: 2;

  padding: 0px 24px;
  gap: 24px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  @media ${QUERIESV2.sm.andDown} {
    gap: 12px;
    padding: 0;
  }
`;

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 24px;
  gap: 24px;
  isolation: isolate;

  height: 72px;

  background: #202024;
  border-bottom: 1px solid #3e4047;

  overflow: clip;
`;

const BackgroundLayer = styled.video`
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0 !important;
  background: linear-gradient(72.13deg, #34353b 0%, rgba(52, 53, 59, 0.75) 100%),
    linear-gradient(0deg, #34353b, #34353b);
  transform: matrix(-1, 0, 0, 1, 0, 0);
  mix-blend-mode: luminosity !important;
  object-fit: cover;
`;

const OpacityLayer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 200%;
  z-index: 1 !important;
  background: linear-gradient(72.13deg, #34353b 0%, rgba(52, 53, 59, 0.75) 100%),
    linear-gradient(0deg, #34353b, #34353b);
  opacity: 0.9;
`;

const StyledMegaphone = styled(Megaphone)`
  height: ${24 / 16}rem;
  width: ${24 / 16}rem;

  @media ${QUERIESV2.tb.andDown} {
    display: none;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%),
    linear-gradient(0deg, #e0f3ff, #e0f3ff);
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StyledButton = styled(Link)`
  height: auto;
  width: auto;
  padding: 0;

  border-radius: 32px;
  border: 1px solid #4c4e57;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 40px;
  height: 40px;

  filter: drop-shadow(0px 0px 24px rgba(109, 250, 217, 0.25));

  &:hover {
    background: #6cf9d8;
    box-shadow: 0px 0px 24px rgba(109, 250, 217, 0.25);
    & svg path {
      stroke: #2d2e33;
    }
  }
`;
