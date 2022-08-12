import Toast from "./Toast";
import { useToast } from "./useToast";

const ToastContainer = () => {
  const { toastList } = useToast();
  return <Toast position="top-right" toastList={toastList} />;
};

export default ToastContainer;
