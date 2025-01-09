import {
  DepositNetworkMismatchProperties,
  TransferQuoteReceivedProperties,
  ampli,
} from "ampli";
import { BigNumber, constants, providers, Signer, utils } from "ethers";
import {
  useConnection,
  useApprove,
  useIsWrongNetwork,
  useAmplitude,
  useQueryParams,
} from "hooks";
import { cloneDeep } from "lodash";
import { useMutation } from "@tanstack/react-query";
import { useHistory } from "react-router-dom";
import {
  GetBridgeFeesResult,
  generateTransferSigned,
  generateTransferSubmitted,
  getConfig,
  getSpokePoolAndVerifier,
  sendSpokePoolVerifierDepositTx,
  sendDepositV3Tx,
  sendSwapAndBridgeTx,
  compareAddressesSimple,
  getToken,
} from "utils";
import { TransferQuote } from "./useTransferQuote";
import { SelectedRoute } from "../utils";
import useReferrer from "hooks/useReferrer";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { CHAIN_IDs } from "@across-protocol/constants";
import { Contract } from "ethers";

const config = getConfig();

export type FromBridgePagePayload = {
  expectedFillTime: string;
  timeSigned: number;
  recipient: string;
  referrer: string;
  tokenPrice: string;
  swapQuote?: Omit<SwapQuoteApiResponse, "minExpectedInputTokenAmount"> & {
    minExpectedInputTokenAmount: string;
  };
  selectedRoute: SelectedRoute;
  quote: GetBridgeFeesResult;
  quotedLimits: BridgeLimitInterface;
  quoteForAnalytics: TransferQuoteReceivedProperties;
  depositArgs: DepositArgs;
};

export function useBridgeAction(
  dataLoading: boolean,
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote
) {
  const { isConnected, signer, account } = useConnection();
  const history = useHistory();
  const { referrer, integratorId } = useReferrer();
  const params = useQueryParams();

  const { isWrongNetworkHandler, isWrongNetwork } = useIsWrongNetwork(
    selectedRoute.fromChain
  );

  const { isWrongNetworkHandler: isWrongNetworkHandlerHyperLiquid } =
    useIsWrongNetwork(CHAIN_IDs.ARBITRUM);

  const approveHandler = useApprove(selectedRoute.fromChain);
  const { addToAmpliQueue } = useAmplitude();

  const existingIntegrator = params["integrator"];

  const buttonActionHandler = useMutation({
    mutationFn: async () => {
      const frozenQuoteForAnalytics = cloneDeep(
        usedTransferQuote?.quoteForAnalytics
      );
      const frozenInitialQuoteTime = usedTransferQuote?.initialQuoteTime;
      const frozenDepositArgs = cloneDeep(
        getDepositArgs(selectedRoute, usedTransferQuote, referrer, integratorId)
      );
      const frozenSwapQuote = cloneDeep(usedTransferQuote?.quotedSwap);
      const frozenFeeQuote = cloneDeep(usedTransferQuote?.quotedFees);
      const frozenLimits = cloneDeep(usedTransferQuote?.quotedLimits);
      const frozenTokenPrice = cloneDeep(usedTransferQuote?.quotePriceUSD);
      const frozenAccount = cloneDeep(account);
      const frozenRoute = cloneDeep(selectedRoute);
      const isSwapRoute = frozenRoute.type === "swap";

      if (
        !frozenDepositArgs ||
        !signer ||
        !frozenAccount ||
        !frozenFeeQuote ||
        !frozenQuoteForAnalytics ||
        !frozenInitialQuoteTime ||
        !frozenTokenPrice ||
        !frozenLimits ||
        // If swap route, we need also the swap quote
        (isSwapRoute && !frozenSwapQuote)
      ) {
        throw new Error("Missing required data for bridge action");
      }

      const externalProjectIsHyperLiquid =
        frozenRoute.externalProjectId === "hyper-liquid";

      let externalPayload: string | undefined;

      if (externalProjectIsHyperLiquid) {
        await isWrongNetworkHandlerHyperLiquid();

        // External Project Inclusion Considerations:
        //
        // HyperLiquid:
        // We need to set up our crosschain message to the hyperliquid bridge with
        // the following considerations:
        // 1. Our recipient address is the default multicall handler
        // 2. The recipient and the signer must be the same address
        // 3. We will first transfer funds to the true recipient EoA
        // 4. We must construct a payload to send to HL's Bridge2 contract
        // 5. The user must sign this signature

        // For now let's assume a 0.05% loss in the amount
        const amount = frozenDepositArgs.amount.mul(9995).div(10000);

        // Build the payload
        const hyperLiquidPayload = await generateHyperLiquidPayload(
          signer,
          frozenDepositArgs.toAddress,
          amount
        );
        // Create a txn calldata for transfering amount to recipient
        const erc20Interface = new utils.Interface([
          "function transfer(address to, uint256 amount) returns (bool)",
        ]);

        const transferCalldata = erc20Interface.encodeFunctionData("transfer", [
          frozenDepositArgs.toAddress,
          amount,
        ]);

        // Encode Instructions struct directly
        externalPayload = utils.defaultAbiCoder.encode(
          [
            "tuple(tuple(address target, bytes callData, uint256 value)[] calls, address fallbackRecipient)",
          ],
          [
            {
              calls: [
                {
                  target: getToken("USDC").addresses![CHAIN_IDs.ARBITRUM],
                  callData: transferCalldata,
                  value: 0,
                },
                {
                  target: "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7", // Bridge2 contract
                  callData: hyperLiquidPayload,
                  value: 0,
                },
              ],
              fallbackRecipient: frozenDepositArgs.toAddress,
            },
          ]
        );
      }

      await isWrongNetworkHandler();

      // If swap route then we need to approve the swap token for the `SwapAndBridge`
      // contract instead of the `SpokePool` contract.
      if (isSwapRoute && frozenRoute.swapTokenSymbol !== "ETH") {
        if (!frozenSwapQuote) {
          throw new Error("Missing swap quote for swap route");
        }
        const swapAndBridgeAddress = config.getSwapAndBridgeAddress(
          frozenRoute.fromChain,
          frozenSwapQuote.dex
        );
        if (!swapAndBridgeAddress) {
          throw new Error("Missing swap and bridge address");
        }

        await approveHandler.mutateAsync({
          erc20Symbol: frozenRoute.swapTokenSymbol,
          approvalAmount: frozenDepositArgs.initialAmount,
          allowedContractAddress: swapAndBridgeAddress,
        });
      }
      // If normal bridge route then we need to approve the token for the `SpokePool`
      // contract.
      else if (frozenRoute.fromTokenSymbol !== "ETH") {
        await approveHandler.mutateAsync({
          erc20Symbol: frozenRoute.fromTokenSymbol,
          approvalAmount: frozenDepositArgs.amount,
          allowedContractAddress: config.getSpokePoolAddress(
            frozenRoute.fromChain
          ),
        });
      }

      addToAmpliQueue(() => {
        // Instrument amplitude before sending the transaction for the submit button.
        ampli.transferSubmitted(
          generateTransferSubmitted(
            frozenQuoteForAnalytics,
            referrer,
            frozenInitialQuoteTime
          )
        );
      });
      const timeSubmitted = Date.now();
      const networkMismatchHandler = (
        networkMismatchProperties: DepositNetworkMismatchProperties
      ) => {
        addToAmpliQueue(() => {
          ampli.depositNetworkMismatch(networkMismatchProperties);
        });
      };

      let tx: providers.TransactionResponse;

      if (isSwapRoute) {
        tx = await sendSwapAndBridgeTx(
          signer,
          {
            ...frozenDepositArgs,
            inputTokenAddress: frozenRoute.fromTokenAddress,
            outputTokenAddress: frozenRoute.toTokenAddress,
            swapQuote: frozenSwapQuote!,
            swapTokenAddress: frozenRoute.swapTokenAddress,
            swapTokenAmount: frozenDepositArgs.initialAmount,
            // Current `SwapAndBridge` contract does not support relative exclusivity.
            // Disabling until we update the contract.
            exclusiveRelayer: constants.AddressZero,
            exclusivityDeadline: 0,
            fillDeadline: frozenFeeQuote.fillDeadline,
          },
          networkMismatchHandler
        );
      } else {
        const isExclusive =
          frozenDepositArgs.exclusivityDeadline > 0 &&
          frozenDepositArgs.exclusiveRelayer !== constants.AddressZero;
        const { spokePool, shouldUseSpokePoolVerifier, spokePoolVerifier } =
          await getSpokePoolAndVerifier(frozenRoute);
        tx =
          shouldUseSpokePoolVerifier && !isExclusive && spokePoolVerifier
            ? await sendSpokePoolVerifierDepositTx(
                signer,
                frozenDepositArgs,
                spokePool,
                spokePoolVerifier,
                networkMismatchHandler
              )
            : await sendDepositV3Tx(
                signer,
                {
                  ...frozenDepositArgs,
                  inputTokenAddress: frozenRoute.fromTokenAddress,
                  outputTokenAddress: frozenRoute.toTokenAddress,
                  fillDeadline: frozenFeeQuote.fillDeadline,
                  message: externalPayload,
                  toAddress: externalProjectIsHyperLiquid
                    ? "0x924a9f036260DdD5808007E1AA95f08eD08aA569" // Default multicall handler
                    : frozenDepositArgs.toAddress,
                },
                spokePool,
                networkMismatchHandler
              );
      }

      addToAmpliQueue(() => {
        ampli.transferSigned(
          generateTransferSigned(
            frozenQuoteForAnalytics,
            referrer,
            timeSubmitted,
            tx.hash
          )
        );
      });

      const fromBridgePagePayload: FromBridgePagePayload = {
        expectedFillTime: usedTransferQuote.estimatedTime.formattedString,
        timeSigned: Date.now(),
        recipient: frozenDepositArgs.toAddress,
        referrer,
        swapQuote: frozenSwapQuote
          ? {
              ...frozenSwapQuote,
              minExpectedInputTokenAmount:
                frozenSwapQuote?.minExpectedInputTokenAmount.toString(),
            }
          : undefined,
        selectedRoute: frozenRoute,
        quote: frozenFeeQuote,
        quotedLimits: frozenLimits,
        quoteForAnalytics: frozenQuoteForAnalytics,
        depositArgs: frozenDepositArgs,
        tokenPrice: frozenTokenPrice.toString(),
      };
      const statusPageSearchParams = new URLSearchParams({
        originChainId: String(frozenRoute.fromChain),
        destinationChainId: String(frozenRoute.toChain),
        inputTokenSymbol: isSwapRoute
          ? frozenRoute.toTokenSymbol
          : frozenRoute.fromTokenSymbol,
        outputTokenSymbol: frozenRoute.toTokenSymbol,
        referrer,
        ...(externalProjectIsHyperLiquid
          ? { externalProjectId: frozenRoute.externalProjectId }
          : {}),
      });
      if (existingIntegrator) {
        statusPageSearchParams.set("integrator", existingIntegrator);
      }
      history.push(
        `/bridge/${tx.hash}?${statusPageSearchParams}`,
        // This state is stored in session storage and therefore persist
        // after a refresh of the deposit status page.
        { fromBridgePagePayload }
      );
    },
  });

  const buttonDisabled =
    !usedTransferQuote ||
    (isConnected && dataLoading) ||
    buttonActionHandler.isLoading;
  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutate,
    isButtonActionLoading: buttonActionHandler.isLoading,
    didActionError: buttonActionHandler.isError,
    buttonLabel: getButtonLabel({
      isConnected,
      isDataLoading: dataLoading,
      isMutating: buttonActionHandler.isLoading,
      isWrongNetwork,
    }),
    buttonDisabled,
  };
}

type DepositArgs = {
  initialAmount: BigNumber;
  amount: BigNumber;
  fromChain: number;
  toChain: number;
  timestamp: BigNumber;
  referrer: string;
  relayerFeePct: BigNumber;
  tokenAddress: string;
  isNative: boolean;
  toAddress: string;
  exclusiveRelayer: string;
  exclusivityDeadline: number;
  integratorId: string;
  externalProjectId?: string;
};
function getDepositArgs(
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote,
  referrer: string,
  integratorId: string
): DepositArgs | undefined {
  const { amountToBridgeAfterSwap, initialAmount, quotedFees, recipient } =
    usedTransferQuote || {};

  if (
    !usedTransferQuote ||
    !quotedFees ||
    !amountToBridgeAfterSwap ||
    !initialAmount ||
    !recipient
  ) {
    return undefined;
  }

  return {
    initialAmount,
    amount: amountToBridgeAfterSwap,
    fromChain: selectedRoute.fromChain,
    toChain: selectedRoute.toChain,
    timestamp: quotedFees.quoteTimestamp,
    referrer,
    relayerFeePct: quotedFees.totalRelayFee.pct,
    tokenAddress: selectedRoute.fromTokenAddress,
    isNative: selectedRoute.isNative,
    toAddress: recipient,
    exclusiveRelayer: quotedFees.exclusiveRelayer,
    exclusivityDeadline: quotedFees.exclusivityDeadline,
    integratorId,
    externalProjectId: selectedRoute.externalProjectId,
  };
}

function getButtonLabel(args: {
  isConnected: boolean;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
}) {
  if (!args.isConnected) {
    return "Connect wallet";
  }
  if (args.isMutating) {
    return "Confirming...";
  }
  if (args.isWrongNetwork) {
    return "Switch network and confirm transaction";
  }
  return "Confirm transaction";
}

/**
 * Creates a payload that will be ingested by Bridge2/batchedDepositWithPermit of a single deposit
 */
export async function generateHyperLiquidPayload(
  signer: Signer,
  recipient: string,
  amount: BigNumber
) {
  const source = await signer.getAddress();

  if (!compareAddressesSimple(source, recipient)) {
    throw new Error("Source and recipient must be the same");
  }

  const timestamp = Date.now();
  const deadline = Math.floor(timestamp / 1000) + 3600;

  // Create USDC contract interface
  const usdcInterface = new utils.Interface([
    "function nonces(address owner) view returns (uint256)",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  ]);

  const usdcContract = new Contract(
    getToken("USDC").addresses![CHAIN_IDs.ARBITRUM],
    usdcInterface,
    signer
  );

  // USDC permit signature with verified domain parameters
  const usdcDomain = {
    name: "USD Coin",
    version: "2",
    chainId: CHAIN_IDs.ARBITRUM,
    verifyingContract: getToken("USDC").addresses![CHAIN_IDs.ARBITRUM]!,
  };

  const permitTypes = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const permitValue = {
    owner: source,
    spender: "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7", // Bridge2 contract address
    value: amount,
    nonce: await usdcContract.nonces(source),
    deadline,
  };

  const permitSignature = await (
    signer as providers.JsonRpcSigner
  )._signTypedData(usdcDomain, permitTypes, permitValue);
  const { r, s, v } = utils.splitSignature(permitSignature);

  const deposit = {
    user: source,
    usd: amount,
    deadline,
    signature: { r: BigNumber.from(r), s: BigNumber.from(s), v },
  };

  const iface = new utils.Interface([
    "function batchedDepositWithPermit(tuple(address user, uint64 usd, uint64 deadline, tuple(uint256 r, uint256 s, uint8 v) signature)[] deposits)",
  ]);

  return iface.encodeFunctionData("batchedDepositWithPermit", [[deposit]]);
}
