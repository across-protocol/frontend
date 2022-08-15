import {
  ToastContainer,
  ToastWrapper,
  ToastElement,
  ImageWrapper,
  Main,
  Title,
  Body,
  TitleRow,
  CloseButton,
  InfoIcon,
  SmInfoIcon,
  CloseWrapper,
} from "./Toast.styles";

import { useToast } from "./useToast";
import { ToastPosition } from "./toast.d";
interface ToastProps {
  position: ToastPosition;
}

const Toast: React.FC<ToastProps> = ({ position }) => {
  const { toastList, deleteToast } = useToast({ autoDeleteTime: 50000 });

  return (
    <>
      <ToastContainer position={position}>
        {toastList.map(({ type, title, body, id, iconSize }, i) => (
          <ToastWrapper key={i} type={type}>
            <ToastElement>
              <TitleRow>
                <ImageWrapper>
                  {iconSize === "sm" ? (
                    <SmInfoIcon type={type} />
                  ) : (
                    <InfoIcon type={type} />
                  )}
                </ImageWrapper>
                <Main>
                  <Title type={type}>{title}</Title>
                  <Body>{body}</Body>
                </Main>
                <CloseWrapper onClick={() => deleteToast(id)}>
                  <CloseButton type={type} />
                </CloseWrapper>
              </TitleRow>
            </ToastElement>
          </ToastWrapper>
        ))}
      </ToastContainer>
    </>
  );
};

export default Toast;
