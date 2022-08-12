import { useState, useEffect } from "react";

import "./Toast.css";

interface ToastProps {
  toastList: ToastProperties[];
  position: string;
  autoDelete?: boolean;
  autoDeleteTime?: number;
}

export interface ToastProperties {
  icon: string;
  title: string;
  body: string;
  id: number;
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
      <div className={`notification-container ${position}`}>
        {list.map((toast, i) => (
          <div key={i} className={`notification toast ${position}`}>
            <button onClick={() => deleteToast(toast.id)}>X</button>
            <div className="notification-image">
              <img src={toast.icon} alt="" />
            </div>
            <div>
              <p className="notification-title">{toast.title}</p>
              <p className="notification-message">{toast.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Toast;
