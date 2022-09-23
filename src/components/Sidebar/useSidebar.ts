import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePrevious, useConnection } from "hooks";
type SidebarWrapperClasses = "open" | "closed" | "transition";

export default function useSidebar(openSidebar: boolean) {
  const { account, ensName, isConnected, chainId } = useConnection();
  const location = useLocation();

  // Note: to avoid a UI issue, we need to transition classes between open -> transition -> closed or vice versa.
  // This is because we want the element when closed to take up no space, but it needs a moment to render on the DOM before it can
  // Properly translateX.
  const [className, setClassName] = useState<SidebarWrapperClasses>("closed");
  const prevOpenSidebar = usePrevious(openSidebar);
  useEffect(() => {
    if (openSidebar && openSidebar !== prevOpenSidebar) {
      setClassName("transition");
      setTimeout(() => {
        setClassName("open");
      }, 100);
    }
    if (!openSidebar && openSidebar !== prevOpenSidebar) {
      setClassName("transition");
      setTimeout(() => {
        setClassName("closed");
      }, 250);
    }
  }, [openSidebar, prevOpenSidebar]);

  const sidebarNavigationLinks = [
    {
      pathName: "/",
      title: "Bridge",
    },
    {
      pathName: "/pool",
      title: "Pool",
    },
    {
      pathName: "/transactions",
      title: "Transactions",
    },
    {
      pathName: "/rewards",
      title: "Rewards",
    },
    {
      pathName: "/about",
      title: "About",
    },
    {
      title: "Docs",
      link: "https://docs.across.to/bridge/",
      isExternalLink: true,
    },
    {
      title: "Support (Discord)",
      link: "https://discord.com/invite/across/",
      isExternalLink: true,
    },
    {
      title: "Github",
      link: "https://github.com/across-protocol",
      isExternalLink: true,
    },
    {
      title: "Twitter",
      link: "https://twitter.com/AcrossProtocol/",
      isExternalLink: true,
    },
    {
      title: "Medium",
      link: "https://medium.com/across-protocol",
      isExternalLink: true,
    },
    {
      title: "Discourse",
      link: "https://forum.across.to/",
      isExternalLink: true,
    },
  ];
  return {
    account,
    ensName,
    isConnected,
    chainId,
    location,
    className,
    setClassName,
    sidebarNavigationLinks,
  };
}
