import usePageScrollLock from "hooks/usePageScrollLock";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  ModalContentWrapper,
  StyledExitIcon,
  Title,
  TitleAndExitWrapper,
  Wrapper,
} from "./Modal.styles";

type ModalDirectionOrientation = "middle" | "top" | "bottom";
export type ModalDirection = {
  desktop?: ModalDirectionOrientation;
  tablet?: ModalDirectionOrientation;
  mobile?: ModalDirectionOrientation;
};

type ModalProps = {
  isOpen?: boolean;
  title?: string;

  height?: number;
  width?: number;

  exitOnOutsideClick?: boolean;
  exitModalHandler: () => void;

  disableExitOverride?: boolean;

  verticalLocation?: ModalDirection;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  height,
  width,
  exitOnOutsideClick,
  exitModalHandler: externalModalExitHandler,
  disableExitOverride,
  children,
  verticalLocation,
}) => {
  const direction: ModalDirection = {
    mobile: "middle",
    desktop: "middle",
    tablet: "middle",
    ...verticalLocation,
  };

  const container = useRef(document.getElementById("modal"));
  const modalContentRef = useRef<HTMLDivElement>(null);
  const exitAnimationTimeoutId = useRef<NodeJS.Timeout>();
  const [forwardAnimation, setForwardAnimation] = useState<boolean>(true);
  const { lockScroll, unlockScroll } = usePageScrollLock();

  const offModalClickHandler = (event: React.MouseEvent<HTMLElement>) => {
    if (
      modalContentRef.current &&
      exitOnOutsideClick &&
      !modalContentRef.current.contains(event.target as Node)
    ) {
      externalModalExitHandler();
    }
  };

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    }
    return () => unlockScroll();
  }, [isOpen, lockScroll, unlockScroll]);

  useEffect(() => {
    return () => {
      const timeoutId = exitAnimationTimeoutId.current;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen && disableExitOverride) {
      setForwardAnimation(false);
      const id = setTimeout(() => {
        externalModalExitHandler();
      }, 500);
      exitAnimationTimeoutId.current = id;
    }
  }, [isOpen, externalModalExitHandler, disableExitOverride]);

  // We create the "modal" element and insert it into the DOM, if it does not exist already
  useLayoutEffect(() => {
    if (!container.current) {
      // we know this to always be defined.
      const root = document.getElementById("root") as HTMLDivElement;
      const div = document.createElement("div");
      div.id = "modal";
      root.insertBefore(div, root.firstChild);
      container.current = div;
    }
  }, []);

  if (!container.current || !isOpen) {
    return null;
  }

  return createPortal(
    <Wrapper
      direction={direction}
      onClick={offModalClickHandler}
      reverseAnimation={!forwardAnimation}
    >
      <ModalContentWrapper ref={modalContentRef} height={height} width={width}>
        <TitleAndExitWrapper>
          <Title>{title}</Title>
          <StyledExitIcon onClick={() => externalModalExitHandler()} />
        </TitleAndExitWrapper>
        {children}
      </ModalContentWrapper>
    </Wrapper>,
    container.current
  );
};

export default Modal;
