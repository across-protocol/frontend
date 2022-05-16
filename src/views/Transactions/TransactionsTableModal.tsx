import React from "react";
import styled from "@emotion/styled";
import { X } from "react-feather";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import { COLORS, QUERIES } from "utils";

import { TxLink } from "./useTransactionsView";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  txLinks: TxLink[];
}

/*
const Dialog: React.FC<Props> = ({ isOpen, onClose, children }) => (
  <Overlay isOpen={isOpen}>
    <Wrapper aria-label="dialog">
      <CloseButton onClick={onClose}>
        <X />
      </CloseButton>
      <div>{children}</div>
    </Wrapper>
  </Overlay>
*/
const TransactionsTableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  txLinks,
}) => {
  return (
    <Overlay isOpen={isOpen}>
      <Wrapper aria-label="dialog">
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
        <div>
          <Title>Fill transactions</Title>
          {txLinks.map((el) => {
            return (
              <Info>
                <Link href={el.url} target="_blank" rel="noreferrer">
                  {el.text}
                </Link>
              </Info>
            );
          })}
        </div>
      </Wrapper>
    </Overlay>
  );
};
export default TransactionsTableModal;

const Title = styled.h1`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 25px;
`;

const Info = styled.article`
  margin-bottom: 20px;
  font-size: ${14 / 16}rem;
`;

const Link = styled.a`
  color: var(--color-secondary);
  text-decoration: none;
  transform: opacity 100ms linear;

  &:hover {
    text-decoration: revert;
  }
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
  top: 0;
  right: 0;
  color: var(--color-gray);
  background-color: transparent;
  padding: 8px;
  border: none;
  outline: none;
  cursor: pointer;
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
