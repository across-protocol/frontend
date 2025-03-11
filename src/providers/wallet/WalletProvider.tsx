import { type PropsWithChildren } from "react";
import { EVMProvider } from "./EVMProvider";
import { SVMProvider } from "./SVMProvider";

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <EVMProvider>
      <SVMProvider>{children}</SVMProvider>
    </EVMProvider>
  );
}
