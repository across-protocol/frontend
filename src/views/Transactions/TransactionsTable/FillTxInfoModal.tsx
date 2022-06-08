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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin in
            lectus purus. Nulla molestie neque vitae felis rhoncus hendrerit.
            Nunc sed sem volutpat, scelerisque ipsum vitae, semper tortor.
            Aliquam ultrices nec neque nec pretium. Suspendisse sit amet lacus
            vel dolor vestibulum convallis. Nunc egestas metus eget metus
            auctor, ut vehicula diam lobortis. Donec vel ligula ultricies,
            condimentum ante a, luctus lorem. Pellentesque nec nisl id felis
            eleifend commodo a ac metus.
          </Info>
          <Info>
            Quisque malesuada justo non ligula aliquam viverra. Duis
            sollicitudin risus sit amet nulla bibendum fermentum. Nunc sem
            lacus, porttitor et mattis sagittis, dignissim vel sem. Vestibulum
            pretium sem purus, et suscipit mi condimentum sit amet. Pellentesque
            volutpat lectus et efficitur auctor. Duis molestie orci sit amet
            nulla pulvinar, non vehicula diam mattis. Lorem ipsum dolor sit
            amet, consectetur adipiscing elit. Donec lacus mi, vehicula at nisi
            sed, scelerisque accumsan velit. In eu libero nisi.
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
