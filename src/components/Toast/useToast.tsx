import { useState, useEffect, useCallback, createContext } from "react";
import { ToastProperties, ToastType } from "./toast.d";

import { useContext } from "react";

interface ToastContextValue {
  toastList: ToastProperties[];
  addToast: (item: PartialToast) => void;
  deleteToast: (id: string[]) => void;
}

interface PartialToast {
  type: ToastType;
  title: string;
  body: string;
  createdAt: number;
  id: string;
}

function useToastManager() {
  const [list, setList] = useState<ToastProperties[]>([
    {
      id: "info-test",
      type: "info",
      title: "Info",
      body: "This is an info toast",
      createdAt: Date.now(),
      iconSize: "sm",
      comp: (
        <div>
          <button>Read more</button>
        </div>
      ),
    },
    {
      id: "warning-time",
      type: "warning",
      title: "Warning",
      createdAt: Date.now(),

      body: "This is an warning toast",
    },
    {
      id: "erorr-123",
      type: "error",
      title: "Error",
      createdAt: Date.now(),

      body: "This is an error toast",
    },
    {
      id: "success-456",
      type: "error",
      title: "Error",
      createdAt: Date.now() + 3000,

      body: "This is an error toast",
    },
  ]);

  const addToast = useCallback(
    (item: PartialToast) => {
      setList([...list, { ...item }]);
    },
    [list]
  );

  const deleteToast = useCallback(
    (ids: string[]) => {
      const nextList = list.filter((item) => !ids.includes(item.id));
      setList(nextList);
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
        const idsToDelete: string[] = [];
        context.toastList.forEach((el) => {
          if (el.createdAt + autoDeleteTime < Date.now()) {
            idsToDelete.push(el.id);
          }
          context.deleteToast(idsToDelete);
        });
      }
    }, autoDeleteTime);

    return () => {
      clearInterval(interval);
    };

    // eslint-disable-next-line
  }, [context.toastList, autoDelete, autoDeleteTime]);

  return context;
}
