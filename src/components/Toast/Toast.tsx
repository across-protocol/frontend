import infoIcon from "assets/icons/info-24.svg";
import {
  Wrapper,
  ToastElement,
  ImageWrapper,
  Main,
  Title,
  Body,
  TitleRow,
  CloseButton,
} from "./Toast.styles";
import { useToast } from "./useToast";
import { ToastPosition } from "./toast.d";
import closeIcon from "assets/icons/cross.svg";
interface ToastProps {
  position: ToastPosition;
}

const Toast: React.FC<ToastProps> = ({ position }) => {
  const { toastList, deleteToast } = useToast();

  return (
    <>
      <Wrapper position={position}>
        {toastList.map((toast, i) => (
          <ToastElement key={i}>
            <TitleRow>
              <ImageWrapper>
                <img src={infoIcon} alt={`toast_icon_${i}`} />
              </ImageWrapper>
              <Title>{toast.title}</Title>
              <CloseButton
                src={closeIcon}
                onClick={() => deleteToast(toast.id)}
                alt="close_icon"
              />
            </TitleRow>
            <Main>
              <Body>{toast.body}</Body>
            </Main>
          </ToastElement>
        ))}
      </Wrapper>
    </>
  );
};

export default Toast;
