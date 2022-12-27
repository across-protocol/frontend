import { useState } from "react";

export function useSelector() {
  const [displayModal, setDisplayModal] = useState(false);

  return {
    displayModal,
    setDisplayModal,
  };
}
