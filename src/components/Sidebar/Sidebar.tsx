import { Sidebar as ReactProSidebar, sidebarClasses } from "react-pro-sidebar";

import { useSidebarContext } from "hooks/useSidebarContext";
import { NavigationContent } from "./components/NavigationContent";
import { WalletContent } from "./components/WalletContent";
import { COLORS } from "utils";

const sidebarWidth = "484px";

const sidebarRootStyles = {
  zIndex: "3000 !important",
  direction: "ltr !important", // hack to display on the right side
  [`@media (max-width: ${sidebarWidth})`]: {
    width: "100%",
    minWidth: "100%",
  },
  borderLeftWidth: "0px !important",
  [`.${sidebarClasses.container}`]: {
    background: "#202024",
    scrollbarWidth: "none",
    borderRadius: "20px 0 0 20px",
    border: `1px solid ${COLORS["grey-400-15"]}`,
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  [`.${sidebarClasses.backdrop}`]: {
    background: "#202024",
    opacity: 0.5,
  },
};

const Sidebar = () => {
  const { isOpen, closeSidebar, contentType } = useSidebarContext();

  return (
    <ReactProSidebar
      onBackdropClick={closeSidebar}
      toggled={isOpen}
      breakPoint="all"
      width={sidebarWidth}
      // @ts-expect-error - react-pro-sidebar types are incorrect
      rootStyles={sidebarRootStyles}
      rtl // hack to display on the right side
    >
      {contentType === "navigation" ? <NavigationContent /> : <WalletContent />}
    </ReactProSidebar>
  );
};

export default Sidebar;
