import { FC, Dispatch, SetStateAction, useState, useEffect } from "react";
import PoolFormSlider from "./PoolFormSlider";
import { useConnection } from "hooks";
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
  InputGroup,
  RoundBox,
  MaxButton,
  Input,
  LiquidityErrorBox,
} from "./RemoveLiquidityForm.styles";
import { ethers } from "ethers";
import { getPoolClient } from "state/poolsApi";
import * as umaSdk from "@uma/sdk";
import {
  formatUnits,
  toWeiSafe,
  addEtherscan,
  max,
  getChainInfo,
  switchChain,
  ChainId,
  calculateRemoveAmount,
} from "utils";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import api from "state/chainApi";
import { ShowSuccess } from "views/Pool";

const { previewRemoval } = umaSdk.across.clients.bridgePool;

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
  wrongNetwork?: boolean | null;
  // refetch balance
  refetchBalance: () => void;
  chainId: ChainId;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  onMaxClick: () => void;
  refetchPool: () => void;
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
  setError,
  onMaxClick,
  refetchPool,
}) => {
  const poolClient = getPoolClient();
  const { isConnected, provider, signer, notify, account, connect } =
    useConnection();
  const [txSubmitted, setTxSubmitted] = useState(false);
  const [updateEthBalance] = api.endpoints.ethBalance.useLazyQuery();
  const chainName = getChainInfo(chainId).name;
  function buttonMessage() {
    if (!isConnected) return "Connect wallet";
    if (wrongNetwork) return `Switch to ${chainName}`;
    return "Remove liquidity";
  }

  useEffect(() => {
    validateForm(removeAmount, position.toString(), decimals, symbol, setError);
  }, [removeAmount, removeAmountSlider, position, decimals, symbol, setError]);

  const buttonDisabled =
    !error && ethers.utils.parseEther(removeAmount || "0").eq(0);

  const handleButtonClick = async () => {
    if (!provider) {
      connect();
    }
    if (isConnected && removeAmountSlider > 0 && signer) {
      const scaler = ethers.BigNumber.from("10").pow(decimals);

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
            refetchPool();
            if (account)
              setTimeout(
                () => updateEthBalance({ chainId: 1, account }),
                15000
              );
          });
          emitter.on("txFailed", (x) => {
            if (transaction.hash) notify.unsubscribe(transaction.hash);
            setTxSubmitted(false);
          });
        }
        return transaction;
      } catch (err: any) {
        setError(err.message);
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
        // the sdk type specifies this needs to be a number but actually can take bignumberish.
        // without setting tofixed is possible to crash the bignumber calculation with decimals
        // longer than 18 digits by inputting very small amounts to withdraw.
        (removeAmountSlider / 100).toFixed(18) as unknown as number
      )
    : null;

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
            data-cy="remove-input"
            placeholder="0.00"
            id="amount"
            value={removeAmount}
            onChange={(e) => setRemoveAmount(e.target.value)}
            disabled={!isConnected}
          />
        </RoundBox>
      </InputGroup>
      {error && <LiquidityErrorBox>{error}</LiquidityErrorBox>}

      <RemoveAmount>
        Amount: <span>{removeAmountSlider.toFixed(2)}%</span>
      </RemoveAmount>
      <PoolFormSlider
        value={removeAmountSlider}
        setValue={setRemoveAmountSlider}
        setRA={(value) => {
          if (value < 100) {
            setRemoveAmount(calculateRemoveAmount(value, position, decimals));
          } else {
            onMaxClick();
          }
        }}
      />
      <RemovePercentButtonsWrapper>
        <RemovePercentButton
          data-cy="remove-25"
          onClick={() => {
            setError("");
            setRemoveAmountSlider(25);
            setRemoveAmount(calculateRemoveAmount(25, position, decimals));
          }}
        >
          25%
        </RemovePercentButton>
        <RemovePercentButton
          data-cy="remove-50"
          onClick={() => {
            setError("");

            setRemoveAmountSlider(50);
            setRemoveAmount(calculateRemoveAmount(50, position, decimals));
          }}
        >
          50%
        </RemovePercentButton>
        <RemovePercentButton
          data-cy="remove-75"
          onClick={() => {
            setError("");

            setRemoveAmountSlider(75);
            setRemoveAmount(calculateRemoveAmount(75, position, decimals));
          }}
        >
          75%
        </RemovePercentButton>
        <RemovePercentButton
          data-cy="remove-max-button"
          onClick={() => {
            setError("");

            setRemoveAmountSlider(100);
            onMaxClick();
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
                Remove amount{" "}
                <FeesPercent>({removeAmountSlider.toFixed(2)}%)</FeesPercent>
              </FeesBoldInfo>
              <FeesInfo>Left in pool</FeesInfo>
            </FeesBlock>
            <FeesBlock>
              <FeesValues data-cy="remove-amount-preview">
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
        {wrongNetwork && provider ? (
          <RemoveFormButton onClick={() => switchChain(provider, chainId)}>
            Switch to {chainName}
          </RemoveFormButton>
        ) : (
          <RemoveFormButton
            data-cy="remove-liquidity-button"
            onClick={handleButtonClick}
            disabled={(wrongNetwork && !provider) || !!error || buttonDisabled}
          >
            {buttonMessage()}
            {txSubmitted ? (
              <BouncingDotsLoader dataCy="bouncing-loader" />
            ) : null}
          </RemoveFormButton>
        )}
      </RemoveFormButtonWrapper>
    </>
  );
};

const validateForm = (
  value: string,
  balance: string,
  decimals: number,
  symbol: string,
  setFormError: React.Dispatch<React.SetStateAction<string>>,
  addLiquidityGas: ethers.BigNumber = ethers.BigNumber.from("0")
) => {
  try {
    const v = value.replaceAll(",", "");

    // liquidity button should be disabled if value is 0, so we dont actually need an error.
    if (Number(v) === 0) return setFormError("");
    if (Number(v) < 0) return setFormError("Cannot be less than 0.");
    if (v && balance) {
      const valueToWei = toWeiSafe(v, decimals);
      if (valueToWei.gt(balance)) {
        return setFormError("Liquidity amount greater than balance.");
      }
    }

    if (v && symbol === "ETH") {
      const valueToWei = toWeiSafe(v, decimals);
      if (valueToWei.add(addLiquidityGas).gt(balance)) {
        return setFormError("Transaction may fail due to insufficient gas.");
      }
    }
    // make sure any previous errors are cleared, for instance when typing .7.
    setFormError("");
  } catch (e) {
    return setFormError("Invalid number.");
  }
};

export default RemoveLiqudityForm;
