import styled from "@emotion/styled";
import { Text } from "components/Text";
import { Link } from "react-router-dom";
import { QUERIESV2 } from "utils";
import BGMesh from "assets/splash-mesh-bg.svg";

export const ExternalWrapper = styled.div`
  background: url(${BGMesh});
  background-size: cover;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  gap: 64px;

  padding: 96px 0;

  @media ${QUERIESV2.sm.andDown} {
    padding: 36px 0;
  }
`;

export const TitleSegment = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: ${48 / 16}rem;
  @media ${QUERIESV2.sm.andDown} {
    gap: ${32 / 16}rem;
  }
`;

export const TitleDescriptionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: ${24 / 16}rem;
  @media ${QUERIESV2.sm.andDown} {
    gap: ${16 / 16}rem;
  }
`;

export const TitleText = styled.div`
  font-style: normal;
  font-weight: 300;
  font-size: ${72 / 16}rem;
  line-height: ${86 / 16}rem;
  text-align: center;
  letter-spacing: -0.02em;

  color: #ffffff;

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${40 / 16}rem;
    line-height: ${48 / 16}rem;
  }
`;

export const DescriptionText = styled(Text)`
  max-width: 560px;
  width: 100%;
  text-align: center;
`;

export const GradientTitleSegment = styled.p`
  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%),
    linear-gradient(0deg, #e0f3ff, #e0f3ff),
    linear-gradient(0deg, #ffffff, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: ${32 / 16}rem;
  @media ${QUERIESV2.sm.andDown} {
    gap: ${24 / 16}rem;
  }
`;

export const BridgeButton = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 64px;

  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%);
  box-shadow: 0px 0px 24px rgba(109, 250, 217, 0.25);
  border-radius: 32px;

  text-decoration: none;

  padding: 0px 40px;
  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
    padding: 0 16px;
  }
`;

export const ButtonText = styled(Text)`
  color: #2d2e33;
  font-weight: 500;
  font-style: normal;
  letter-spacing: 0;
`;

export const DocButton = styled.a`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  text-decoration: none;
`;

export const NumericBenefitWrapper = styled.div`
  padding-top: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;

  flex-wrap: wrap;

  max-width: 756px;
  margin: auto;
  width: 100%;
  @media ${QUERIESV2.sm.andDown} {
    padding: 0;
    row-gap: 24px;
    & > div {
      width: 50%;
    }
  }
`;

export const CardBenefitWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;

  & > div {
    width: calc(50% - 12px);
  }
  @media ${QUERIESV2.sm.andDown} {
    & > div {
      width: 100%;
    }
    gap: 16px;
  }
`;
