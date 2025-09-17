import { bytesToString } from "viem";

export function handleTevmError(result: any, next: any) {
  if (result.execResult.exceptionError) {
    const error = result.execResult.exceptionError;

    switch (error.error) {
      case "out of gas":
        console.error("Transaction ran out of gas");
        break;
      case "revert":
        console.error(
          "Transaction reverted:",
          bytesToString(result.execResult.returnValue)
        );
        break;
      case "invalid opcode":
        console.error("Invalid opcode encountered");
        break;
      default:
        console.error("Unknown error:", error);
    }
  }
  next?.();
}
