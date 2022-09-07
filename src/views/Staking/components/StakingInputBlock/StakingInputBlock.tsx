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
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import { AlertInfo } from "../StakingReward/AlertInfo";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import { StylizedSVG } from "utils/types";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  valid: boolean;
  buttonText: string;
  Logo: StylizedSVG;
  maxValue: string;
  omitInput?: boolean;
  onClickHandler: () => void | Promise<void>;
  displayLoader?: boolean;
  errorMessage?: string;
}

const StakingInputBlock: React.FC<Props> = ({
  value,
  setValue,
  valid,
  buttonText,
  Logo,
  maxValue,
  displayLoader,
  omitInput,
  onClickHandler,
  errorMessage,
}) => (
  <Wrapper>
    <InputRow>
      {!omitInput && (
        <InputWrapper valid={!value || valid}>
          <Logo />
          <Input
            placeholder="Enter amount"
            value={value}
            type="text"
            onChange={(e) => setValue(e.target.value)}
            disabled={displayLoader}
          />
          <MaxButton
            disabled={displayLoader || !maxValue}
            onClick={() => setValue(maxValue ?? "")}
          >
            Max
          </MaxButton>
        </InputWrapper>
      )}
      <ButtonWrapper>
        <StakeButton
          valid={valid}
          fullWidth={omitInput}
          onClick={onClickHandler}
          disabled={!valid || displayLoader || value === "0"}
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
    {!!value && !valid && !!errorMessage && (
      <AlertInfo danger>{errorMessage}</AlertInfo>
    )}
  </Wrapper>
);

export default StakingInputBlock;
