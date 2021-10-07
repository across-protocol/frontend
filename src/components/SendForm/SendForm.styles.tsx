import styled from "@emotion/styled";
import { PrimaryButton } from "../BaseButton";

export const Section = styled.section`
  border-bottom: 1px solid var(--primary-dark);
  padding: 35px 30px;
`;
export const AccentSection = styled(Section)`
  background-image: linear-gradient(var(--primary-dark), var(--gray));
  color: var(--transparent-white);
  border-right: 1px solid var(--gray);
  border-left: 1px solid var(--gray);
  font-size: ${16 / 16}rem;
  flex: 1;
`;

export const SendButton = styled(PrimaryButton)`
  font-size: ${22 / 16}rem;
  font-weight: bold;
`;

export const SendWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Info = styled.div`
  display: flex;
  justify-content: space-between;

  &:not(:last-of-type) {
    margin-bottom: 16px;
  }
  &:last-of-type {
    margin-bottom: 32px;
  }
`;
