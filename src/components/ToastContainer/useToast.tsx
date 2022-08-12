import { useState, useCallback, createContext } from "react";
import { ToastProperties } from "./Toast";

import { useContext } from "react";

interface ToastContextValue {
  toastList: ToastProperties[];
  addToast: (item: PartialToast) => void;
}

interface PartialToast {
  icon: string;
  title: string;
  body: string;
}

function useToastManager() {
  const [list, setList] = useState<ToastProperties[]>([]);
  const [id, setId] = useState(0);
  const addToast = useCallback((item: PartialToast) => {
    setList([...list, { ...item, id }]);
    setId((pv) => pv + 1);
  }, []);

  return {
    toastList: list,
    addToast,
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
