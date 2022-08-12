import { createContext } from "react";
import { ToastProperties } from "./Toast";

export const ToastContext = createContext({
  list: [] as ToastProperties[],
  setList: () => {},
});
