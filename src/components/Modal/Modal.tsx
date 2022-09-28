import usePageScrollLock from "hooks/usePageScrollLock";
import React, { useEffect, useRef, useState } from "react";
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
  title?: string;

  height?: number;
  width?: number;

  exitOnOutsideClick?: boolean;
  exitModalHandler: () => void;

  disableExitOverride?: boolean;

  verticalLocation?: ModalDirection;
};

const Modal: React.FC<ModalProps> = ({
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

  console.log(direction);

  const modalContentRef = useRef<HTMLDivElement>(null);
  const exitAnimationTimeoutId = useRef<NodeJS.Timeout>();
  const [forwardAnimation, setForwardAnimation] = useState<boolean>(true);
  const { lockScroll, unlockScroll } = usePageScrollLock();

  const exitHandler = () => {
    if (!disableExitOverride) {
      setForwardAnimation(false);
      const id = setTimeout(() => {
        externalModalExitHandler();
      }, 500);
      exitAnimationTimeoutId.current = id;
    }
  };

  const offModalClickHandler = (event: React.MouseEvent<HTMLElement>) => {
    if (
      modalContentRef.current &&
      exitOnOutsideClick &&
      !modalContentRef.current.contains(event.target as Node)
    ) {
      exitHandler();
    }
  };

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, [lockScroll, unlockScroll]);

  useEffect(() => {
    return () => {
      const timeoutId = exitAnimationTimeoutId.current;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <Wrapper
      direction={direction}
      onClick={offModalClickHandler}
      reverseAnimation={!forwardAnimation}
    >
      <ModalContentWrapper ref={modalContentRef} height={height} width={width}>
        <TitleAndExitWrapper>
          <Title>{title}</Title>
          <StyledExitIcon onClick={() => exitHandler()} />
        </TitleAndExitWrapper>
        {children}
      </ModalContentWrapper>
    </Wrapper>
  );
};

export default Modal;
