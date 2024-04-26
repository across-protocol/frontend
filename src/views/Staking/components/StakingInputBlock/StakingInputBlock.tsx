import {
  ButtonWrapper,
  StakeButton,
  Wrapper,
  StakeButtonContentWrapper,
} from "./StakingInputBlock.styles";
import { trackMaxButtonClicked } from "utils";
import { useAmplitude } from "hooks";
import { AmountInput } from "components/AmountInput";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  valid: boolean;
  invalid: boolean;
  poolTokenSymbol: string;
  maxValue: string;
  onClickHandler: () => void | Promise<void>;
  displayLoader?: boolean;
  warningButtonColor?: boolean;
  disableInput?: boolean;
  stakingAction: "stake" | "unstake";
}

const StakingInputBlock: React.FC<Props> = ({
  value,
  setValue,
  valid,
  invalid,
  poolTokenSymbol,
  maxValue,
  displayLoader,
  onClickHandler,
  warningButtonColor,
  disableInput,
  stakingAction,
}) => {
  const { addToAmpliQueue } = useAmplitude();
  return (
    <Wrapper>
      <AmountInput
        amountInput={value}
        onChangeAmountInput={setValue}
        onClickMaxBalance={() => {
          setValue(maxValue ?? "");
          addToAmpliQueue(() => {
            trackMaxButtonClicked(
              stakingAction === "stake" ? "stakeForm" : "unstakeForm"
            );
          });
        }}
        validationError={invalid ? "Invalid amount" : undefined}
        disableInput={disableInput}
        displayTokenIcon={true}
        inputTokenSymbol={poolTokenSymbol}
      />
      <ButtonWrapper>
        <StakeButton
          onClick={onClickHandler}
          disabled={!valid || invalid || displayLoader}
          backgroundColor={warningButtonColor ? "yellow" : "aqua"}
        >
          <StakeButtonContentWrapper>
            {displayLoader ? (
              <span>
                {stakingAction === "stake" ? "Staking..." : "Unstaking..."}
              </span>
            ) : (
              <span>{stakingAction}</span>
            )}
          </StakeButtonContentWrapper>
        </StakeButton>
      </ButtonWrapper>
    </Wrapper>
  );
};

export default StakingInputBlock;
