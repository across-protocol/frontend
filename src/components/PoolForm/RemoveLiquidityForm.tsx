import { FC, Dispatch, SetStateAction, useState, useEffect } from "react";
import PoolFormSlider from "./PoolFormSlider";
import { useConnection } from "state/hooks";
import {
  RemoveAmount,
  RemovePercentButtonsWrapper,
  RemovePercentButton,
  RemoveFormButton,
  RemoveFormButtonWrapper,
  FeesBlockWrapper,
  FeesBlock,
  FeesValues,
  FeesBoldInfo,
  FeesInfo,
  FeesPercent,
  RemoveFormErrorBox,
  InputGroup,
  RoundBox,
  MaxButton,
  Input,
} from "./RemoveLiquidityForm.styles";
import { ethers } from "ethers";
import { getPoolClient } from "state/poolsApi";
import * as umaSdk from "@uma/sdk";
import {
  formatUnits,
  toWeiSafe,
  addEtherscan,
  max,
  onboard,
  getChainInfo,
  switchChain,
  ChainId,
} from "utils";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import api from "state/chainApi";
import { ShowSuccess } from "views/Pool";

const { previewRemoval } = umaSdk.across.clients.bridgePool;

const toBN = ethers.BigNumber.from;

interface Props {
  removeAmount: string;
  setRemoveAmount: React.Dispatch<React.SetStateAction<string>>;
  removeAmountSlider: number;
  setRemoveAmountSlider: Dispatch<SetStateAction<number>>;
  lpTokens: ethers.BigNumber;
  decimals: number;
  symbol: string;
  tokenAddress: string;
  setShowSuccess: React.Dispatch<React.SetStateAction<ShowSuccess | undefined>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
  balance: string;
  position: ethers.BigNumber;
  totalPosition: ethers.BigNumber;
  feesEarned: ethers.BigNumber;
  wrongNetwork?: boolean;
  // refetch balance
  refetchBalance: () => void;
  chainId: ChainId;
  error: string;
  onMaxClick: () => void;
}
const RemoveLiqudityForm: FC<Props> = ({
  removeAmount,
  setRemoveAmount,
  removeAmountSlider,
  setRemoveAmountSlider,
  lpTokens,
  decimals,
  symbol,
  tokenAddress,
  setShowSuccess,
  setDepositUrl,
  position,
  feesEarned,
  wrongNetwork,
  totalPosition,
  chainId,
  error,
  onMaxClick,
}) => {
  const poolClient = getPoolClient();
  const { init } = onboard;
  const { isConnected, provider, signer, notify, account } = useConnection();
  const [txSubmitted, setTxSubmitted] = useState(false);
  const [updateEthBalance] = api.endpoints.ethBalance.useLazyQuery();
  const chainName = getChainInfo(chainId).name;
  function buttonMessage() {
    if (!isConnected) return "Connect wallet";
    if (wrongNetwork) return `Switch to ${chainName}`;
    return "Remove liquidity";
  }
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    setErrorMessage("");
  }, [removeAmountSlider]);

  const handleButtonClick = async () => {
    if (!provider) {
      init();
    }
    if (isConnected && removeAmountSlider > 0 && signer) {
      setErrorMessage("");
      const scaler = toBN("10").pow(decimals);

      const removeAmountToWei = toWeiSafe(
        (removeAmountSlider / 100).toString(),
        decimals
      );

      const weiAmount = lpTokens.mul(removeAmountToWei).div(scaler);

      try {
        let txId;
        if (symbol === "ETH") {
          txId = await poolClient.removeEthliquidity(signer, weiAmount);
        } else {
          txId = await poolClient.removeTokenLiquidity(
            signer,
            tokenAddress,
            weiAmount
          );
        }
        const transaction = poolClient.getTxState(txId);

        if (transaction.hash) {
          setTxSubmitted(true);

          const { emitter } = notify.hash(transaction.hash);
          emitter.on("all", addEtherscan);

          emitter.on("txConfirmed", (tx) => {
            if (transaction.hash) notify.unsubscribe(transaction.hash);
            const url = `https://etherscan.io/tx/${transaction.hash}`;
            setShowSuccess("withdraw");
            setDepositUrl(url);
            setTxSubmitted(false);
            if (account)
              setTimeout(
                () => updateEthBalance({ chainId: 1, account }),
                15000
              );
          });
          emitter.on("txFailed", () => {
            if (transaction.hash) notify.unsubscribe(transaction.hash);
            setTxSubmitted(false);
          });
        }
        return transaction;
      } catch (err: any) {
        setErrorMessage(err.message);
        console.error("err in RemoveLiquidity call", err);
      }
    }
  };

  const preview = isConnected
    ? previewRemoval(
        {
          totalDeposited: position,
          feesEarned: max(feesEarned, 0),
          positionValue: totalPosition,
        },
        removeAmountSlider / 100
      )
    : null;

  const calculateRemoveAmount = (
    percent: number,
    position: ethers.BigNumber,
    decimals: number
  ) => {
    const scaler = toBN("10").pow(decimals);

    const removeAmountToWei = toWeiSafe((percent / 100).toString(), decimals);

    const weiAmount = position.mul(removeAmountToWei).div(scaler);
    return formatUnits(weiAmount, decimals);
  };

  return (
    <>
      <InputGroup>
        <RoundBox
          as="label"
          htmlFor="amount"
          style={{
            // @ts-expect-error TS does not likes custom CSS vars
            "--color": error
              ? "var(--color-error-light)"
              : "var(--color-white)",
            "--outline-color": error
              ? "var(--color-error)"
              : "var(--color-primary)",
          }}
        >
          <MaxButton onClick={onMaxClick} disabled={!isConnected}>
            max
          </MaxButton>
          <Input
            placeholder="0.00"
            id="amount"
            value={removeAmount}
            onChange={(e) => setRemoveAmount(e.target.value)}
            disabled={!isConnected}
          />
        </RoundBox>
      </InputGroup>
      <RemoveAmount>
        Amount: <span>{removeAmountSlider}%</span>
      </RemoveAmount>
      <PoolFormSlider
        value={removeAmountSlider}
        setValue={setRemoveAmountSlider}
      />
      <RemovePercentButtonsWrapper>
        <RemovePercentButton
          onClick={() => {
            setRemoveAmountSlider(25);
            setRemoveAmount(calculateRemoveAmount(25, position, decimals));
          }}
        >
          25%
        </RemovePercentButton>
        <RemovePercentButton
          onClick={() => {
            setRemoveAmountSlider(50);
            setRemoveAmount(calculateRemoveAmount(50, position, decimals));
          }}
        >
          50%
        </RemovePercentButton>
        <RemovePercentButton
          onClick={() => {
            setRemoveAmountSlider(75);
            setRemoveAmount(calculateRemoveAmount(75, position, decimals));
          }}
        >
          75%
        </RemovePercentButton>
        <RemovePercentButton
          onClick={() => {
            setRemoveAmountSlider(100);
            setRemoveAmount(formatUnits(position.toString(), decimals));
          }}
        >
          MAX
        </RemovePercentButton>
      </RemovePercentButtonsWrapper>

      {isConnected && (
        <>
          <FeesBlockWrapper>
            <FeesBlock>
              <FeesBoldInfo>
                Remove amount <FeesPercent>({removeAmountSlider}%)</FeesPercent>
              </FeesBoldInfo>
              <FeesInfo>Left in pool</FeesInfo>
            </FeesBlock>
            <FeesBlock>
              <FeesValues>
                {preview && formatUnits(preview.position.recieve, decimals)}{" "}
                {symbol}
              </FeesValues>
              <FeesValues>
                {preview && formatUnits(preview.position.remain, decimals)}{" "}
                {symbol}
              </FeesValues>
            </FeesBlock>
          </FeesBlockWrapper>
          <FeesBlockWrapper>
            <FeesBlock>
              <FeesBoldInfo>Fees claimed</FeesBoldInfo>
              <FeesInfo>Left in pool</FeesInfo>
            </FeesBlock>
            <FeesBlock>
              <FeesValues>
                {preview && formatUnits(preview.fees.recieve, decimals)}{" "}
                {symbol}
              </FeesValues>
              <FeesValues>
                {preview && formatUnits(preview.fees.remain, decimals)} {symbol}
              </FeesValues>
            </FeesBlock>
          </FeesBlockWrapper>
          <FeesBlockWrapper>
            <FeesBlock>
              <FeesBoldInfo>You will receive</FeesBoldInfo>
            </FeesBlock>
            <FeesBlock>
              <FeesValues>
                {preview && formatUnits(preview.total.recieve, decimals)}{" "}
                {symbol}
              </FeesValues>
            </FeesBlock>
          </FeesBlockWrapper>
        </>
      )}
      <RemoveFormButtonWrapper>
        {errorMessage && (
          <RemoveFormErrorBox>
            <div>{errorMessage}</div>
          </RemoveFormErrorBox>
        )}
        {wrongNetwork && provider ? (
          <RemoveFormButton onClick={() => switchChain(provider, chainId)}>
            Switch to {chainName}
          </RemoveFormButton>
        ) : (
          <RemoveFormButton
            onClick={handleButtonClick}
            disabled={wrongNetwork && !provider}
          >
            {buttonMessage()}
            {txSubmitted ? <BouncingDotsLoader /> : null}
          </RemoveFormButton>
        )}
      </RemoveFormButtonWrapper>
    </>
  );
};

export default RemoveLiqudityForm;
