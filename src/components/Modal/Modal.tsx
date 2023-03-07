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
  title?: string | JSX.Element;

  height?: number;
  width?: number;
  padding?: "normal" | "thin";

  exitOnOutsideClick?: boolean;
  exitModalHandler: () => void;

  disableExitOverride?: boolean;

  verticalLocation?: ModalDirectionOrientation | ModalDirection;
  topYOffset?: number;
  "data-cy"?: string;
  bottomYOffset?: number;
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
  verticalLocation: _verticalLocation,
  topYOffset,
  bottomYOffset,
  padding,
  "data-cy": dataCy,
}) => {
  const verticalLocation: ModalDirection | undefined =
    typeof _verticalLocation === "string"
      ? {
          desktop: _verticalLocation,
          tablet: _verticalLocation,
          mobile: _verticalLocation,
        }
      : _verticalLocation;

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
      data-cy={dataCy}
    >
      <ModalContentWrapper
        ref={modalContentRef}
        height={height}
        width={width}
        topYOffset={topYOffset}
        bottomYOffset={bottomYOffset}
        padding={padding ?? "normal"}
      >
        <TitleAndExitWrapper>
          {typeof title === "string" ? (
            <Title>{title}</Title>
          ) : (
            <div>{title}</div>
          )}

          <StyledExitIcon onClick={() => externalModalExitHandler()} />
        </TitleAndExitWrapper>
        {children}
      </ModalContentWrapper>
    </Wrapper>,
    container.current
  );
};

export default Modal;
