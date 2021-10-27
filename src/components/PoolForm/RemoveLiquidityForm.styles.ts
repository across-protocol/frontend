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
`;

export const RemovePercentButton = styled(BaseButton)`
  flex-basis: 20%;
  justify-content: space-evenly;
  background-color: hsla(0, 0%, 100%, 1);
  color: hsla(230, 6%, 19%, 1);
  font-size: 0.875rem;
`;
