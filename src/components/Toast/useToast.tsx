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
  const [list, setList] = useState<ToastProperties[]>([]);

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
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
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
        });
        if (idsToDelete.length > 0) {
          context.deleteToast(idsToDelete);
        }
      }
    }, autoDeleteTime);

    return () => {
      clearInterval(interval);
    };

    // eslint-disable-next-line
  }, [context.toastList, autoDelete, autoDeleteTime]);

  return context;
}
