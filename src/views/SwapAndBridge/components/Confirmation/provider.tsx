import { SwapApprovalApiCallReturnType } from "../../../../utils/serverless-api/prod/swap-approval";
import { TokenImage } from "../../../../components";
import React, { ReactElement } from "react";
import { ReactComponent as Across } from "assets/token-logos/acx.svg";
import { ReactComponent as Circle } from "assets/extern-logos/circle.svg";
import usdt0Logo from "assets/token-logos/usdt0.svg";
import hypeLogo from "assets/token-logos/hype.svg";

export type BridgeProvider =
  | "across"
  | "hypercore"
  | "cctp"
  | "oft"
  | "sponsored-intent"
  | "sponsored-oft"
  | "sponsored-cctp";

export const getProviderFromQuote = (
  swapQuote: SwapApprovalApiCallReturnType | null
) => (swapQuote?.steps.bridge.provider || "across") as BridgeProvider;

export const getProviderDisplay = (provider: BridgeProvider) => {
  return PROVIDER_DISPLAY[provider];
};

const PROVIDER_DISPLAY: Record<
  BridgeProvider,
  { label: string; logo: ReactElement }
> = {
  across: { label: "Across V4", logo: <Across width="16px" height="16px" /> },
  "sponsored-intent": {
    label: "Across V4",
    logo: <Across width="16px" height="16px" />,
  },
  cctp: { label: "CCTP", logo: <Circle width="16px" height="16px" /> },
  "sponsored-cctp": {
    label: "CCTP",
    logo: <Circle width="16px" height="16px" />,
  },
  oft: {
    label: "OFT",
    logo: (
      <TokenImage src={usdt0Logo} alt="usdt-logo" width="16px" height="16px" />
    ),
  },
  "sponsored-oft": {
    label: "OFT",
    logo: (
      <TokenImage src={usdt0Logo} alt="usdt-logo" width="16px" height="16px" />
    ),
  },
  hypercore: {
    label: "Hypercore",
    logo: (
      <TokenImage
        src={hypeLogo}
        alt="hyperliquid-logo"
        width="16px"
        height="16px"
      />
    ),
  },
};
