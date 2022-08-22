import styled from "@emotion/styled";
import { AlertCircle, Gift } from "react-feather";
import { ReactComponent as AcrossLogo } from "assets/Across-logo-bullet.svg";

export const Wrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  background: #34353b;

  border: 1px solid #3e4047;
  border-radius: 10px;

  flex-wrap: nowrap;

  padding: 24px;
  gap: 24px;
  @media (max-width: 576px) {
    margin: 0 auto;
    width: calc(100% - 24px);
    padding: 12px 16px;
    gap: 16px;
  }
`;

export const InnerWrapper = styled.div`
  width: 100%;
`;

export const StakingInputBlockWrapper = styled(InnerWrapper)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Title = styled.p`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  line-height: 26px;
  color: #c5d5e0;

  font-size: 18px;
  @media (max-width: 576px) {
    font-size: 16px;
  }
`;

export const InfoTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  /* align-items: center; */
  align-items: stretch;
  padding: 0px;
  gap: 6px;

  width: 100%;

  color: #9daab2;
`;

export const AlertInfoWrapper = styled(InfoTextWrapper)`
  color: #f96c6c;
`;

export const InfoText = styled.span`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
`;

export const InfoIcon = styled(AlertCircle)`
  flex-shrink: 0;
  margin-top: 3px;
  width: 13.5px;
  height: 13.5px;
`;

export const Divider = styled.div`
  width: 100%;
  height: 1px;

  background: #3e4047;

  flex: none;
  order: 0;
  align-self: stretch;
  flex-grow: 0;
`;

export const StakingClaimAmountWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 100%;
  height: 20px;
`;

export const StakingClaimAmountText = styled.div`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  color: #e0f3ff;

  @media (max-width: 576px) {
    font-size: 14px;
    line-height: 18px;
  }
`;

export const StakingClaimAmountTitle = styled(StakingClaimAmountText)`
  color: #9daab2;
`;

export const PresentIcon = styled(Gift)`
  color: var(--color-primary);
  width: 16px;
  height: 16px;
`;

export const StakingClaimAmountInnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 6px;
  height: 20px;
  border-radius: 4px;
  flex: none;
  order: 1;
  flex-grow: 0;
`;

export const StyledAcrossLogo = styled(AcrossLogo)``;
