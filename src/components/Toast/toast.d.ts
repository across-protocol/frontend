export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastProperties {
  id: number;
  type: ToastType;
  title: string;
  body: string;
}
