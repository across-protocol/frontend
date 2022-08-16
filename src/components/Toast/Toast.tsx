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
  const { toastList, deleteToast } = useToast();

  return (
    <>
      <ToastContainer position={position}>
        {toastList.map(({ type, title, body, id, iconSize, comp }, i) => (
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
                  {comp}
                </Main>
                <CloseWrapper onClick={() => deleteToast([id])}>
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
