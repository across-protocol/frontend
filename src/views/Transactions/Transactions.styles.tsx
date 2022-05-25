import styled from "@emotion/styled";
import { PrimaryButton, BaseButton } from "components/Buttons";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;
`;

export const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto;
  max-width: 1425px;

  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const Title = styled.h1`
  font-size: ${30 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 700;

  @media ${QUERIES.tabletAndDown} {
    order: 2;
  }

  @media ${QUERIES.mobileAndDown} {
    font-size: ${18 / 16}rem;
    line-height: ${22 / 16}rem;
    font-weight: 400;
  }
`;

export const Account = styled.span`
  font-size: ${16 / 16}rem;
  font-weight: 400;
  margin-left: 16px;
`;

export const ConnectButton = styled(PrimaryButton)`
  margin-top: 3rem;
  width: 200px;
  height: 50px;
  padding: 0;
`;

export const ButtonWrapper = styled.div`
  margin: 0 auto;
  max-width: 1425px;
`;

export const TopRow = styled.div<{ dark?: boolean }>`
  background-color: ${({ dark }) =>
    dark ? "var(--color-gray-175)" : "var(--color-gray-500)"};
  padding: 2rem;

  @media ${QUERIES.mobileAndDown} {
    padding: 2rem ${20 / 16}rem;
  }
`;

export const BottomRow = styled.div`
  background-color: var(--color-gray-500);
  padding: ${25 / 16}rem 2rem 2rem;

  @media ${QUERIES.mobileAndDown} {
    padding: ${25 / 16}rem ${20 / 16}rem;
  }
`;

export const LoadingWrapper = styled.div`
  width: 150px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  color: var(--color-primary);

  svg {
    color: var(--color-primary);
  }
  > div {
    margin-top: 6px;
    font-size: ${14 / 16}rem;
  }
`;

export const NotFoundWrapper = styled.div`
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  color: var(--color-primary);
  img {
    height: 150px;
    width: 150px;
    margin: 0 auto;
  }
  > div {
    margin-top: 6px;
    font-size: ${12 / 16}rem;
  }
`;

export const EthNoteWrapper = styled.div`
  margin: 1.5rem auto 1rem;
  max-width: 1425px;

  img {
    height: 14px;
    width: 14px;

    &:nth-of-type(2) {
      margin-right: 1rem;
    }
  }

  span {
  }

  @media ${QUERIES.mobileAndDown} {
    img {
      &:nth-of-type(2) {
        margin-right: 0.5rem;
      }
    }

    span {
      font-size: ${14 / 16}rem;
    }
  }
`;

export const TableWrapper = styled.div`
  margin: 0;

  @media ${QUERIES.mobileAndDown} {
    margin: 0 -${20 / 16}rem;
  }
`;

export const SwitchContainer = styled.div`
  position: relative;
  display: flex;
  border: 1px solid var(--color-black);
  border-radius: 6px;
  overflow: hidden;

  @media ${QUERIES.tabletAndDown} {
    margin: 0 0 ${24 / 16}rem;
  }
`;

export const SwitchButton = styled(BaseButton)`
  flex-basis: 50%;
  height: 40px;
  padding: 0 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  color: var(--color-white);
  z-index: 1;
  font-size: ${14 / 16}rem;

  @media ${QUERIES.mobileAndDown} {
    line-height: ${16 / 16}rem;
    padding: 0 16px;
    height: 32px;
  }
`;

export const SwitchOverlay = styled.div<{ position: number }>`
  position: absolute;
  top: 0;
  left: ${({ position }) => `${position * 50}%`};
  height: 100%;
  width: 50%;
  background-color: var(--color-black);
  pointer-events: none;
  transition: left 0.2s ease-out;
`;
