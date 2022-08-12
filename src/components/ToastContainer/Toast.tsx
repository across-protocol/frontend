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

interface ToastProps {
  position: string;
  autoDelete?: boolean;
  autoDeleteTime?: number;
}

export interface ToastProperties {
  id: number;
  type: "info" | "error" | "warning";
  title: string;
  body: string;
}

const Toast: React.FC<ToastProps> = ({ position }) => {
  const { toastList, deleteToast } = useToast();

  return (
    <>
      <Wrapper className={`notification-container ${position}`}>
        {toastList.map((toast, i) => (
          <ToastElement key={i} position="top-right">
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
