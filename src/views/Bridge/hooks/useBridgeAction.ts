import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { BigNumber } from "ethers";
import {
  useConnection,
  useApprove,
  useIsWrongNetwork,
  useAmplitude,
} from "hooks";
import { cloneDeep } from "lodash";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import {
  AcrossDepositArgs,
  generateTransferSigned,
  generateTransferSubmitted,
  getConfig,
  sendAcrossDeposit,
} from "utils";

const config = getConfig();

export function useBridgeAction(
  dataLoading: boolean,
  payload?: AcrossDepositArgs,
  tokenSymbol?: string,
  recentQuote?: TransferQuoteReceivedProperties,
  recentInitialQuoteTime?: number,
  tokenPrice?: BigNumber
) {
  const { isConnected, connect, signer, account } = useConnection();
  const history = useHistory();

  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork(
    payload?.fromChain
  );

  const approveHandler = useApprove(payload?.fromChain);
  const { addToAmpliQueue } = useAmplitude();

  const buttonActionHandler = useMutation(async () => {
    const frozenQuote = cloneDeep(recentQuote);
    const frozenInitialQuoteTime = recentInitialQuoteTime;
    const frozenPayload = cloneDeep(payload);
    const referrer = frozenPayload?.referrer ?? "";
    const frozenTokenPrice = cloneDeep(tokenPrice);
    const frozenAccount = cloneDeep(account);

    if (!isConnected) {
      connect();
      return;
    }

    if (
      !frozenPayload ||
      !signer ||
      !frozenAccount ||
      !frozenQuote ||
      !frozenInitialQuoteTime ||
      !frozenTokenPrice ||
      !tokenSymbol
    ) {
      throw new Error("Missing required data for bridge action");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    if (tokenSymbol !== "ETH") {
      await approveHandler.mutateAsync({
        erc20Address: config.getTokenInfoBySymbol(
          frozenPayload.fromChain,
          tokenSymbol
        ).address,
        approvalAmount: frozenPayload.amount,
        allowedContractAddress: config.getSpokePoolAddress(
          frozenPayload.fromChain
        ),
      });
    }

    addToAmpliQueue(() => {
      // Instrument amplitude before sending the transaction for the submit button.
      ampli.transferSubmitted(
        generateTransferSubmitted(frozenQuote, referrer, frozenInitialQuoteTime)
      );
    });
    const timeSubmitted = Date.now();

    const tx = await sendAcrossDeposit(
      signer,
      frozenPayload,
      (networkMismatchProperties) => {
        addToAmpliQueue(() => {
          ampli.depositNetworkMismatch(networkMismatchProperties);
        });
      }
    );

    addToAmpliQueue(() => {
      ampli.transferSigned(
        generateTransferSigned(frozenQuote, referrer, timeSubmitted, tx.hash)
      );
    });

    const statusPageSearchParams = new URLSearchParams({
      originChainId: String(frozenPayload.fromChain),
      destinationChainId: String(frozenPayload.toChain),
      bridgeTokenSymbol: tokenSymbol,
      referrer,
    }).toString();
    history.push(
      `/bridge/${tx.hash}?${statusPageSearchParams}`,
      // This state is stored in session storage and therefore persist
      // after a refresh of the deposit status page.
      {
        fromBridgePagePayload: {
          sendDepositArgs: frozenPayload,
          quote: frozenQuote,
          referrer,
          account: frozenAccount,
          timeSigned: Date.now(),
          tokenPrice,
        },
      }
    );
  });

  const buttonDisabled =
    !payload || (isConnected && dataLoading) || buttonActionHandler.isLoading;

  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutate,
    isButtonActionLoading: buttonActionHandler.isLoading,
    didActionError: buttonActionHandler.isError,
    buttonLabel: getButtonLabel({
      isConnected,
      isDataLoading: dataLoading,
      isMutating: buttonActionHandler.isLoading,
    }),
    buttonDisabled,
  };
}

function getButtonLabel(args: {
  isConnected: boolean;
  isDataLoading: boolean;
  isMutating: boolean;
}) {
  if (!args.isConnected) {
    return "Connect wallet";
  }
  if (args.isMutating) {
    return "Confirming...";
  }
  if (args.isDataLoading) {
    return "Loading...";
  }
  return "Confirm transaction";
}
