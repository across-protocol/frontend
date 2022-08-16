import { useState, useEffect, useCallback, createContext } from "react";
import { ToastProperties, ToastType } from "./toast.d";

import { useContext } from "react";

interface ToastContextValue {
  toastList: ToastProperties[];
  addToast: (item: PartialToast) => void;
  deleteToast: (id: number | string) => void;
}

interface PartialToast {
  type: ToastType;
  title: string;
  body: string;
}

function useToastManager() {
  const [list, setList] = useState<ToastProperties[]>([
    {
      id: "info-test",
      type: "info",
      title: "Info",
      body: "This is an info toast",
      iconSize: "sm",
    },
    {
      id: "warning-time",
      type: "warning",
      title: "Warning",
      body: "This is an warning toast",
    },
    {
      id: "erorr-123",
      type: "error",
      title: "Error",
      body: "This is an error toast",
    },
    {
      id: 4,
      type: "error",
      title: "Error",
      body: "This is an error toast",
    },
  ]);
  // Current id for toast
  const [cid, setCid] = useState(0);
  const addToast = useCallback(
    (item: PartialToast) => {
      setList([...list, { ...item, id: cid }]);
      setCid((pv) => pv + 1);
    },
    [cid, list]
  );

  const deleteToast = useCallback(
    (id: number | string) => {
      const listItemIndex = list.findIndex((e) => e.id === id);
      const newList = [...list];
      newList.splice(listItemIndex, 1);
      setList(newList);
    },
    [list]
  );

  return {
    toastList: list,
    addToast,
    deleteToast,
  };
}

const ToastContext = createContext<ToastContextValue>({} as ToastContextValue);
ToastContext.displayName = "ToastContext";
export const ToastProvider: React.FC = ({ children }) => {
  const value = useToastManager();
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export function useToast({
  autoDelete = true,
  autoDeleteTime = 3000,
}: {
  autoDelete?: boolean;
  autoDeleteTime?: number;
} = {}) {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within an <ToastProvider>");
  }
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoDelete && context.toastList.length) {
        context.deleteToast(context.toastList[0].id);
      }
    }, autoDeleteTime);

    return () => {
      clearInterval(interval);
    };

    // eslint-disable-next-line
  }, [context.toastList, autoDelete, autoDeleteTime]);

  return context;
}
