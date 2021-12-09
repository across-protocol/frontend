import styled from "@emotion/styled";
import { PrimaryButton, Section, AccentSection } from "components";

export const Wrapper = styled.div`
  padding-top: 50px;
`;

export const Header = styled(Section)`
  padding: 8px 0 45px;
`;

export const Link = styled.a`
  color: var(--color-primary);
  cursor: pointer;
  display: block;
  width: fit-content;
  margin: auto;
  transition: opacity 100ms linear;
  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
  margin-top: 0.5rem;
`;

export const SecondaryLink = styled(Link)`
  color: inherit;
`;

export const InfoSection = styled(AccentSection)`
  padding: 30px 40px;
  border-top: none;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const Info = styled.article`
  border-bottom: 1px solid var(--color-primary-dark);
  --horizontalPadding: 40px;
  margin: 0 calc(-1 * var(--horizontalPadding));
  padding: 15px 40px;

  & > div {
    display: flex;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 10px;
  }
`;

export const Button = styled(PrimaryButton)`
  font-size: ${22 / 16}rem;
  font-weight: bold;
  width: 100%;
  margin-top: 24px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 99px;
  margin-right: 10px;
`;

export const SuccessIconRow = styled.div`
  display: inline-block;
  margin: 0;
  width: 33%;
  background-color: #6cf9d8;
  height: 2px;
  > div {
    margin-top: -36px;

    &:first-child {
      margin-left: 110px;
    }
    &:nth-child(2) {
      margin-left: 320px;
    }
  }
`;

export const ConfirmationLine = styled.div`
  width: 31%;
  background-color: #6cf9d8;
  height: 2px;
  opacity: 0.3;
  display: inline-block;
`;

export const SuccessIcon = styled.div`
  background-color: var(--color-primary);
  color: var(--color-gray);
  border-radius: 9999px;
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  position: absolute;
  z-index: 10000;
`;

export const ConfirmationIcon = styled(SuccessIcon)`
  opacity: 0.5;
  z-index: 100000;
  > div {
    font-size: 0.8rem;
  }
`;

export const SuccessInfoRow = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  margin-top: 2rem;
`;

export const SuccessInfoBlock = styled.div``;

export const SuccessInfoText = styled.div`
  color: #ffffff;
  font-weight: 600;
`;

export const ConfirmationText = styled(SuccessInfoText)`
  opacity: 0.5;
  color: hsla(0, 0%, 100%, 1);
`;
