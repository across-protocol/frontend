// useSidebarContext.ts

import { useContext } from "react";
import { SidebarContext } from "providers/SidebarProvider";

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}
