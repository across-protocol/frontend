import { useState, useEffect } from "react";
import infoIcon from "assets/icons/info-24.svg";
import { Wrapper, ToastElement } from "./Toast.styles";
import "./Toast.css";

interface ToastProps {
  toastList: ToastProperties[];
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

const Toast: React.FC<ToastProps> = ({
  toastList,
  position,
  autoDelete,
  autoDeleteTime,
}) => {
  const [list, setList] = useState(toastList);

  useEffect(() => {
    setList([...toastList]);
  }, [toastList]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (autoDelete && toastList.length && list.length) {
        deleteToast(toastList[0].id);
      }
    }, autoDeleteTime);

    return () => {
      clearInterval(interval);
    };

    // eslint-disable-next-line
  }, [toastList, autoDelete, autoDeleteTime, list]);

  const deleteToast = (id: number) => {
    const listItemIndex = list.findIndex((e) => e.id === id);
    const toastListItem = toastList.findIndex((e) => e.id === id);
    list.splice(listItemIndex, 1);
    toastList.splice(toastListItem, 1);
    setList([...list]);
  };

  return (
    <>
      <Wrapper className={`notification-container ${position}`}>
        {list.map((toast, i) => (
          <ToastElement key={i} position="top-right">
            <button onClick={() => deleteToast(toast.id)}>X</button>
            <div className="notification-image">
              <img src={infoIcon} alt="" />
            </div>
            <div>
              <p className="notification-title">{toast.title}</p>
              <p className="notification-message">{toast.body}</p>
            </div>
          </ToastElement>
        ))}
      </Wrapper>
    </>
  );
};

export default Toast;
