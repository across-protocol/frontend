import {
  DepositNetworkMismatchProperties,
  TransferQuoteReceivedProperties,
  ampli,
} from "ampli";
import { BigNumber, constants, providers, utils } from "ethers";
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
  manualRebalancerAddresses,
  ChainId,
  getToken,
  acrossPlusMulticallHandler,
  hyperLiquidBridge2Address,
  externalProjectNameToId,
  generateHyperLiquidPayload,
  fixedPointAdjustment,
} from "utils";
import { TransferQuote } from "./useTransferQuote";
import { SelectedRoute } from "../utils";
import useReferrer from "hooks/useReferrer";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { CHAIN_IDs } from "@across-protocol/constants";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";

const config = getConfig();

export type FromBridgePagePayload = {
  expectedFillTime: string;
  timeSigned: number;
  recipient: string;
  referrer: string;
  tokenPrice: string;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
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
      const frozenUniversalSwapQuote = cloneDeep(
        usedTransferQuote?.quotedUniversalSwap
      );
      const frozenFeeQuote = cloneDeep(usedTransferQuote?.quotedFees);
      const frozenLimits = cloneDeep(usedTransferQuote?.quotedLimits);
      const frozenTokenPrice = cloneDeep(usedTransferQuote?.quotePriceUSD);
      const frozenAccount = cloneDeep(account);
      const frozenRoute = cloneDeep(selectedRoute);
      const isSwapRoute = frozenRoute.type === "swap";
      const isUniversalSwapRoute = frozenRoute.type === "universal-swap";

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
        (isSwapRoute && !frozenSwapQuote) ||
        (isUniversalSwapRoute && !frozenUniversalSwapQuote)
      ) {
        throw new Error("Missing required data for bridge action");
      }

      const externalProjectIsHyperLiquid =
        frozenRoute.externalProjectId === "hyperliquid";

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

        // Subtract the relayer fee pct just like we do for our output token amount
        const amount = frozenDepositArgs.amount.sub(
          frozenDepositArgs.amount
            .mul(frozenDepositArgs.relayerFeePct)
            .div(fixedPointAdjustment)
        );

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
                  target: hyperLiquidBridge2Address,
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

      // If universal swap route then we need to approve the universal swap token for the `SwapAndBridge`
      if (
        isUniversalSwapRoute &&
        frozenUniversalSwapQuote?.approvalTxns &&
        frozenUniversalSwapQuote.approvalTxns.length > 0
      ) {
        if (!frozenUniversalSwapQuote) {
          throw new Error(
            "Missing universal swap quote for universal swap route"
          );
        }

        // Some ERC-20 tokens require multiple approvals
        for (const approvalTxn of frozenUniversalSwapQuote.approvalTxns) {
          const approvalTx = await signer.sendTransaction(approvalTxn);
          await approvalTx.wait();
        }
      }
      // If swap route then we need to approve the swap token for the `SwapAndBridge`
      // contract instead of the `SpokePool` contract.
      else if (isSwapRoute && frozenRoute.swapTokenSymbol !== "ETH") {
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
          enforceCorrectNetwork: frozenRoute.externalProjectId !== undefined,
        });
      }

      addToAmpliQueue(() => {
        // Instrument amplitude before sending the transaction for the submit button.
        ampli.transferSubmitted(
          generateTransferSubmitted(
            frozenQuoteForAnalytics,
            referrer,
            frozenInitialQuoteTime,
            externalProjectIsHyperLiquid
              ? externalProjectNameToId(frozenRoute.externalProjectId)
              : undefined
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

      // If the connected wallet is configured as a manual rebalancer and the origin
      // chain is mainnet, we force the deposit to be unprofitable with a long
      // exclusivity. The idea is to have these deposits paid out as a slow fill, in
      // which case the SpokePool's own balance will be used to complete the fill, and
      // the HubPool will pull funds back from the mainnet SpokePool instead. This
      // allows us to skip the 7 day bridges and ensure a safe level of HubPool liquidity
      if (
        manualRebalancerAddresses.includes(utils.getAddress(frozenAccount)) &&
        frozenRoute.fromChain === ChainId.MAINNET
      ) {
        const { spokePool } = await getSpokePoolAndVerifier(frozenRoute);
        tx = await sendDepositV3Tx(
          signer,
          {
            ...frozenDepositArgs,
            inputTokenAddress: frozenRoute.fromTokenAddress,
            outputTokenAddress: frozenRoute.toTokenAddress,
            // Force overrides to make deposit unattractive for relayers
            relayerFeePct: BigNumber.from(0),
            exclusiveRelayer: frozenAccount,
            exclusivityDeadline: 10 * 60, // 10 minutes
          },
          spokePool,
          networkMismatchHandler
        );
      } else if (isUniversalSwapRoute) {
        if (!frozenUniversalSwapQuote) {
          throw new Error(
            "Missing universal swap quote for universal swap route"
          );
        }

        tx = await signer.sendTransaction({
          to: frozenUniversalSwapQuote.swapTx.to,
          data: frozenUniversalSwapQuote.swapTx.data,
          value: frozenUniversalSwapQuote.swapTx.value,
        });
      } else if (isSwapRoute) {
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
        const depositArgs = {
          ...frozenDepositArgs,
          inputTokenAddress: frozenRoute.fromTokenAddress,
          outputTokenAddress: frozenRoute.toTokenAddress,
          fillDeadline: frozenFeeQuote.fillDeadline,
          message: externalPayload,
          toAddress: externalProjectIsHyperLiquid
            ? acrossPlusMulticallHandler[frozenRoute.toChain]
            : frozenDepositArgs.toAddress,
        };
        tx =
          shouldUseSpokePoolVerifier && !isExclusive && spokePoolVerifier
            ? await sendSpokePoolVerifierDepositTx(
                signer,
                depositArgs,
                spokePool,
                spokePoolVerifier,
                networkMismatchHandler
              )
            : await sendDepositV3Tx(
                signer,
                depositArgs,
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
            tx.hash,
            externalProjectIsHyperLiquid
              ? externalProjectNameToId(frozenRoute.externalProjectId)
              : undefined
          )
        );
      });

      const fromBridgePagePayload: FromBridgePagePayload = {
        expectedFillTime: usedTransferQuote.estimatedTime.formattedString,
        timeSigned: Date.now(),
        recipient: frozenDepositArgs.toAddress,
        referrer,
        swapQuote: frozenSwapQuote,
        universalSwapQuote: frozenUniversalSwapQuote,
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
    buttonActionHandler.isPending;
  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutate,
    isButtonActionLoading: buttonActionHandler.isPending,
    didActionError: buttonActionHandler.isError,
    buttonLabel: getButtonLabel({
      isConnected,
      isDataLoading: dataLoading,
      isMutating: buttonActionHandler.isPending,
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