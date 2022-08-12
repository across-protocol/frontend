import { useState } from "react";
import Toast, { ToastProperties } from "./Toast";
import infoIcon from "assets/icons/info-24.svg";

const ToastContainer = () => {
  const [list] = useState<ToastProperties[]>([
    {
      icon: infoIcon,
      title: "Error",
      body: "Error with ENS name",
      id: 1,
    },
  ]);

  return <Toast position="top-right" toastList={list} />;
};

export default ToastContainer;
