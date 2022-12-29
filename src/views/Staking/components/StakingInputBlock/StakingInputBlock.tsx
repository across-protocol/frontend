import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  MaxButton,
  Wrapper,
  LoaderWrapper,
  StakeButtonContentWrapper,
  TokenIcon,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import { trackMaxButtonClicked } from "utils";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  valid: boolean;
  invalid: boolean;
  buttonText: string;
  logoURI: string;
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
  buttonText,
  logoURI,
  maxValue,
  displayLoader,
  onClickHandler,
  warningButtonColor,
  disableInput,
  stakingAction,
}) => (
  <Wrapper>
    <InputRow>
      <InputWrapper valid={valid} invalid={invalid}>
        <TokenIcon src={logoURI} />
        <Input
          valid={valid}
          invalid={invalid}
          placeholder="Enter amount"
          value={value}
          type="text"
          onChange={(e) => setValue(e.target.value)}
          disabled={displayLoader || disableInput}
          onKeyDown={(e) => e.key === "Enter" && valid && onClickHandler()}
        />
        <MaxButton
          disabled={displayLoader || disableInput || !maxValue}
          onClick={() => {
            setValue(maxValue ?? "");
            trackMaxButtonClicked(
              stakingAction === "stake" ? "stakeForm" : "unstakeForm"
            );
          }}
        >
          Max
        </MaxButton>
      </InputWrapper>

      <ButtonWrapper>
        <StakeButton
          valid={valid}
          onClick={onClickHandler}
          disabled={!valid || invalid}
          warningButtonColor={warningButtonColor}
        >
          <StakeButtonContentWrapper>
            <span>{capitalizeFirstLetter(buttonText)}</span>
            {displayLoader && (
              <LoaderWrapper>
                <BouncingDotsLoader />
              </LoaderWrapper>
            )}
          </StakeButtonContentWrapper>
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  </Wrapper>
);

export default StakingInputBlock;
