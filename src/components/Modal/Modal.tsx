import usePageScrollLock from "hooks/usePageScrollLock";
import { useTabIndexManager } from "hooks/useTabIndexManager";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  CloseButton,
  ElementRowDivider,
  ModalContentWrapper,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Title,
  TitleAndExitWrapper,
  Wrapper,
} from "./Modal.styles";
import { ReactComponent as ExitIcon } from "assets/icons/cross.svg";

type ModalDirectionOrientation = "middle" | "top" | "bottom";
export type ModalDirection = {
  desktop?: ModalDirectionOrientation;
  tablet?: ModalDirectionOrientation;
  mobile?: ModalDirectionOrientation;
};

export type ModalProps = {
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
  noScroll?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  titleBorder?: boolean;
  className?: string;
  closeButtonTabIndex?: number;
};

const Modal = ({
  isOpen,
  title,
  height,
  width,
  exitOnOutsideClick,
  exitModalHandler: externalModalExitHandler,
  disableExitOverride,
  children,
  footer,
  verticalLocation: _verticalLocation,
  topYOffset,
  bottomYOffset,
  padding,
  className,
  "data-cy": dataCy,
  titleBorder = false,
  noScroll = false,
  closeButtonTabIndex = 999999, // should default to being last
}: ModalProps) => {
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
  const exitAnimationTimeoutId = useRef<number>();
  const [forwardAnimation, setForwardAnimation] = useState<boolean>(true);
  const { lockScroll, unlockScroll } = usePageScrollLock();

  // Manage tab indices when modal is open - only elements inside modal will be focusable
  useTabIndexManager(!!isOpen, modalContentRef);

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

  useLayoutEffect(() => {
    if (!container.current) {
      const root = document.getElementById("root") || document.body;
      const div = document.createElement("div");
      div.id = "modal";
      root.insertBefore(div, root.firstChild);
      container.current = div;
    }
  }, []);

  if (!container.current || !isOpen) {
    return null;
  }

  return (
    <>
      {createPortal(
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
            className={className}
          >
            <ModalHeader>
              <TitleAndExitWrapper>
                {typeof title === "string" ? (
                  <Title>{title}</Title>
                ) : (
                  <div>{title}</div>
                )}

                <CloseButton
                  tabIndex={closeButtonTabIndex}
                  onClick={() => externalModalExitHandler()}
                >
                  <ExitIcon />
                </CloseButton>
              </TitleAndExitWrapper>
              {titleBorder && <ElementRowDivider />}
            </ModalHeader>

            <ModalContent noScroll={noScroll}>{children}</ModalContent>

            {footer && <ModalFooter>{footer}</ModalFooter>}
          </ModalContentWrapper>
        </Wrapper>,
        container.current
      )}
    </>
  );
};

export default Modal;
