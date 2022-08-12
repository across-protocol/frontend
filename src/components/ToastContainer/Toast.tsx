import infoIcon from "assets/icons/info-24.svg";
import {
  Wrapper,
  ToastElement,
  ImageWrapper,
  Main,
  Title,
  Body,
} from "./Toast.styles";
import "./Toast.css";
import { useToast } from "./useToast";
import { ToastPosition } from "./toast.d";

interface ToastProps {
  position: ToastPosition;
}

const Toast: React.FC<ToastProps> = ({ position }) => {
  const { toastList, deleteToast } = useToast();

  return (
    <>
      <Wrapper>
        {toastList.map((toast, i) => (
          <ToastElement key={i} position={position}>
            <button onClick={() => deleteToast(toast.id)}>X</button>
            <ImageWrapper>
              <img src={infoIcon} alt={`toast_icon_${i}`} />
            </ImageWrapper>
            <Main>
              <Title>{toast.title}</Title>
              <Body>{toast.body}</Body>
            </Main>
          </ToastElement>
        ))}
      </Wrapper>
    </>
  );
};

export default Toast;
