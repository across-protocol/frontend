import styled from "@emotion/styled";
import { BaseButton, PrimaryButton } from "../Buttons";

export const RemoveFormButton = styled(PrimaryButton)`
  margin-top: 2rem;
  width: 90%;
  background: hsla(166, 92%, 70%, 1);
  color: hsla(230, 6%, 19%, 1);
  font-weight: 700;
  font-size: 1.1.rem;
  line-height: 1.25rem;
  padding: 1rem 0.5rem;
  margin-left: 1.5rem;
  margin-right: 1.5rem;
`;

export const RemoveFormButtonWrapper = styled.div`
  background: linear-gradient(180deg, #334243 0%, rgba(51, 66, 67, 0) 100%);
  margin-left: -1rem;
  margin-right: -1rem;
  margin-top: 1rem;
`;

export const RemoveAmount = styled.div`
  font-size: 1.25rem;
  color: #fff;
  font-weight: 700;
  font-family: "Barlow";
  padding-bottom: 2rem;
  padding-left: 0.5rem;
  span {
    color: hsla(166, 92%, 70%, 1);
  }
`;

export const RemovePercentButtonsWrapper = styled.div`
  display: flex;
  margin-top: 2rem;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const RemovePercentButton = styled(BaseButton)`
  flex-basis: 20%;
  justify-content: space-evenly;
  background-color: hsla(0, 0%, 100%, 1);
  color: hsla(230, 6%, 19%, 1);
  font-size: 0.875rem;
`;

export const Balance = styled.div`
  display: flex;
  justify-content: flex-end;
  span {
    color: hsla(166, 92%, 70%, 1);
    font-size: 0.75rem;
    font-family: "Barlow";
    line-height: 1rem;
    margin-right: 1.5rem;
    margin-top: 0.66rem;
  }
`;

export const FeesBlockWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
`;

export const FeesBlock = styled.div`
  color: #ffffff;
  font-family: "Barlow";
`;

export const FeesPercent = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
`;

export const FeesBoldInfo = styled.div`
  font-size: 1rem;
  font-weight: 700;
`;

export const FeesInfo = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
`;

export const FeesValues = styled.div`
  text-align: right;
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  &:first-of-type {
    font-weight: 700;
    font-size: 1rem;
    color: #ffffff;
  }
`;
