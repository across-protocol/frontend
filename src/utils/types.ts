import { Theme } from "@emotion/react";
import { StyledComponent } from "@emotion/styled";

export type StylizedSVG = StyledComponent<
  React.SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  } & {
    children?: React.ReactNode;
  } & {
    theme?: Theme | undefined;
  }
>;

export type VoidHandler = () => void;

export type DepositStatusFilter = "all" | "pending" | "filled" | "refunded";
