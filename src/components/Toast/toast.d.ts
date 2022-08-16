export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export type ToastType = "success" | "info" | "warning" | "error";
export type IconSize = "sm" | "md" | undefined;

export interface ToastProperties {
  id: string;
  type: ToastType;
  title: string;
  body: string;
  createdAt: number;
  iconSize?: IconSize;
  // Allow any type of component to be passed if you need to render more than the title or body
  comp?: React.ReactElement;
}
