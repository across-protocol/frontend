import React, { useEffect, useRef, useState } from "react";
import {
  ModalContentWrapper,
  StyledExitIcon,
  Title,
  TitleAndExitWrapper,
  Wrapper,
} from "./Modal.styles";

type ModalProps = {
  title?: string;

  height?: number;
  width?: number;

  exitOnOutsideClick?: boolean;
  exitModalHandler: () => void;
};

const Modal: React.FC<ModalProps> = ({
  title,
  height,
  width,
  exitOnOutsideClick,
  exitModalHandler: externalModalExitHandler,
  children,
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const exitAnimationTimeoutId = useRef<NodeJS.Timeout>();
  const [forwardAnimation, setForwardAnimation] = useState<boolean>(true);

  const exitHandler = () => {
    setForwardAnimation(false);
    const id = setTimeout(() => {
      externalModalExitHandler();
    }, 500);
    exitAnimationTimeoutId.current = id;
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
    // Disable scrolling while modal is rendered
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
      onClick={offModalClickHandler}
      reverseAnimation={!forwardAnimation}
    >
      <ModalContentWrapper ref={modalContentRef} height={height} width={width}>
        <TitleAndExitWrapper>
          <Title>{title}</Title>
          <StyledExitIcon onClick={() => exitHandler()} />
        </TitleAndExitWrapper>
      </ModalContentWrapper>
    </Wrapper>
  );
};

export default Modal;
