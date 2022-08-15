import { useState, useCallback, createContext } from "react";
import { ToastProperties, ToastType } from "./toast.d";

import { useContext } from "react";

interface ToastContextValue {
  toastList: ToastProperties[];
  addToast: (item: PartialToast) => void;
  deleteToast: (id: number) => void;
}

interface PartialToast {
  type: ToastType;
  title: string;
  body: string;
}

function useToastManager() {
  const [list, setList] = useState<ToastProperties[]>([]);
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
    (id: number) => {
      const listItemIndex = list.findIndex((e) => e.id === id);
      const toastListItem = list.findIndex((e) => e.id === id);
      list.splice(listItemIndex, 1);
      list.splice(toastListItem, 1);
      setList([...list]);
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

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within an <ToastProvider>");
  }
  return context;
}
