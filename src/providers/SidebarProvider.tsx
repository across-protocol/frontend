import { createContext, useCallback, useState } from "react";

export type SidebarContentType =
  | "navigation"
  | "connect-wallet"
  | "connect-wallet";

export const SidebarContext = createContext<{
  isOpen: boolean;
  contentType: SidebarContentType;
  openSidebar: (contentType?: SidebarContentType) => void;
  closeSidebar: () => void;
}>({
  isOpen: false,
  contentType: "navigation",
  openSidebar: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] =
    useState<SidebarContentType>("navigation");
  const openSidebar = useCallback(
    (contentType: SidebarContentType = "navigation") => {
      setIsOpen(true);
      setContentType(contentType);
    },
    []
  );
  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setContentType("navigation");
    }, 500);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, contentType, openSidebar, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
