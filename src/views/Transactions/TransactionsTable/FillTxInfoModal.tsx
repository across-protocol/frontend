import React from "react";
import styled from "@emotion/styled";
import { X } from "react-feather";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import { COLORS, QUERIES } from "utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FillTxInfoModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Overlay isOpen={isOpen}>
      <Wrapper aria-label="dialog">
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
        <div>
          <Title>Information on Partially Filled Transactions</Title>
          <Info>
            Subject to the state of relayer capital within Across, it is
            possible for a transaction to be only partially filled. Don't worry,
            your funds are safe. Although unlikely, it could take 2-4hrs for
            your transaction to complete.
          </Info>
          <Info>
            If you have concerns, please submit a ticket in our{" "}
            <Link
              href="https://discord.gg/across"
              target="_blank"
              rel="noreferrer"
            >
              Discord support channel.
            </Link>
          </Info>
        </div>
      </Wrapper>
    </Overlay>
  );
};
export default FillTxInfoModal;

const Title = styled.h1`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 25px;
`;

const Info = styled.article`
  margin-bottom: 20px;
  font-size: ${14 / 16}rem;
`;

const Wrapper = styled(DialogContent)`
  position: relative;
  padding: 20px 25px;
  background-color: var(--color-primary);
  color: var(--color-gray);
  outline: none;
  border-radius: 12px;
  max-width: 600px;
  width: min(600px, calc(100% - 20px));
  top: 25%;
  overflow: auto;
  min-height: 30vh;
  max-height: 80vh;
  @media ${QUERIES.tabletAndUp} {
    top: 30%;
    min-height: 20vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 6px;
  color: var(--color-gray);
  background-color: transparent;
  padding: 8px;
  border: none;
  outline: none;
  cursor: pointer;
  > svg {
    height: 32px;
    width: 32px;
  }
`;

const Overlay = styled(DialogOverlay)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const Link = styled.a`
  color: var(--color-gray);
  text-decoration: none;
  transform: opacity 100ms linear;
  font-weight: 600;
  &:hover {
    text-decoration: revert;
  }
`;
