import Toast from "./Toast";
import infoIcon from "assets/icons/info-24.svg";
import { useToast } from "./useToast";

const ToastContainer = () => {
  const { toastList, addToast } = useToast();
  return (
    <>
      <button
        style={{
          width: "200px",
          height: "40px",
          color: "white",
          backgroundColor: "red",
        }}
        onClick={() =>
          addToast({
            icon: infoIcon,
            title: "Error",
            body: "Error with ENS name",
          })
        }
      >
        Add Toast
      </button>
      <Toast position="top-right" toastList={toastList} />
    </>
  );
};

export default ToastContainer;
