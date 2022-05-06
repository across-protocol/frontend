import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { useLocation } from "react-router-dom";

type SidebarWrapperClasses = "open" | "closed" | "transition";
export default function useSidebar(openSidebar: boolean) {
  const { account, isConnected, chainId } = useConnection();
  const location = useLocation();

  // Note: to avoid a UI issue, we need to transition classes between open -> transition -> closed or vice versa.
  // This is because we want the element when closed to take up no space, but it needs a moment to render on the DOM before it can
  // Properly translateX.
  const [className, setClassName] = useState<SidebarWrapperClasses>("closed");
  useEffect(() => {
    if (openSidebar) {
      setClassName("transition");
      setTimeout(() => {
        setClassName("open");
      }, 100);
    }
    if (!openSidebar) {
      setClassName("transition");
      setTimeout(() => {
        setClassName("closed");
      }, 1000);
    }
  }, [openSidebar]);
  return {
    account,
    isConnected,
    chainId,
    location,
    className,
    setClassName,
  };
}
