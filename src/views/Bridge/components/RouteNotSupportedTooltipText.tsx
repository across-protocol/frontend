import { Text } from "components/Text";
import {
  getChainInfo,
  bridgedUSDCSymbolsMap,
  chainsWithNativeUSDC,
} from "utils";

type Props = {
  symbol: string;
  fromChain: number;
  toChain: number;
};

export const RouteNotSupportedTooltipText = ({
  symbol,
  fromChain,
  toChain,
}: Props) => {
  const isOnlyBridgedUsdcSupported =
    (chainsWithNativeUSDC.includes(fromChain) ||
      chainsWithNativeUSDC.includes(toChain)) &&
    symbol === "USDC";

  return (
    <Text color="white-70" size="sm">
      {isOnlyBridgedUsdcSupported ? (
        <>
          Across currently only supports{" "}
          <Text color="white-100" size="sm" as="a">
            {
              bridgedUSDCSymbolsMap[
                chainsWithNativeUSDC.includes(fromChain) ? fromChain : toChain
              ]
            }
          </Text>{" "}
          (bridged USDC) on{" "}
          <Text color="white-100" size="sm" as="a">
            {
              getChainInfo(
                chainsWithNativeUSDC.includes(fromChain) ? fromChain : toChain
              ).name
            }
          </Text>
          .
        </>
      ) : (
        <>
          <Text color="white-100" size="sm" as="a">
            {symbol}
          </Text>{" "}
          is not supported on route{" "}
          <Text color="white-100" size="sm" as="a">
            {getChainInfo(fromChain).name}
          </Text>{" "}
          {"->"}{" "}
          <Text color="white-100" size="sm" as="a">
            {getChainInfo(toChain).name}
          </Text>
          . Pick a different asset or change the route.
        </>
      )}
    </Text>
  );
};

export default RouteNotSupportedTooltipText;
