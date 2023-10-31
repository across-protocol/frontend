import { useState } from "react";
import styled from "@emotion/styled";
import { useLocation, useHistory } from "react-router";

import { UnstyledButton } from "components/Button";
import { QUERIES } from "utils";

const SwitchContainer = styled.div`
  position: relative;
  display: flex;
  border: 1px solid var(--color-black);
  border-radius: 6px;
  overflow: hidden;
  @media ${QUERIES.tabletAndDown} {
    margin: 0 0 ${24 / 16}rem;
  }
`;

const SwitchButton = styled(UnstyledButton)`
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

const SwitchOverlay = styled.div<{ position: number }>`
  position: absolute;
  top: 0;
  left: ${({ position }) => `${position * 50}%`};
  height: 100%;
  width: 50%;
  background-color: var(--color-black);
  pointer-events: none;
  transition: left 0.2s ease-out;
`;

export function TableSwitch() {
  const [hovered, setHovered] = useState<number | undefined>(0);
  const location = useLocation();
  const history = useHistory();

  const overlayPosition = hovered || getOverlayPosition(location.pathname);

  return (
    <SwitchContainer>
      <SwitchButton
        onMouseEnter={() => {
          setHovered(0);
        }}
        onMouseLeave={() => {
          setHovered(undefined);
        }}
        onClick={() => {
          history.replace("/transactions");
        }}
      >
        My Transactions
      </SwitchButton>
      <SwitchButton
        onMouseEnter={() => {
          setHovered(1);
        }}
        onMouseLeave={() => {
          setHovered(undefined);
        }}
        onClick={() => {
          history.replace("/transactions/all");
        }}
      >
        All Transactions
      </SwitchButton>
      <SwitchOverlay position={overlayPosition} />
    </SwitchContainer>
  );
}

function getOverlayPosition(pathname: string) {
  if (pathname.includes("all")) {
    return 1;
  }
  return 0;
}
