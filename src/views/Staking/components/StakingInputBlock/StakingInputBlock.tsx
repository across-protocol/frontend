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
import { StylizedSVG } from "../../types";
import { AlertInfo } from "../StakingReward/AlertInfo";
import { Loader } from "components/Loader";

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
}) => {
  return (
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
            disabled={!valid || displayLoader}
          >
            <StakeButtonContentWrapper>
              <span>{capitalizeFirstLetter(buttonText)}</span>
              {displayLoader && (
                <LoaderWrapper>
                  <Loader />
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
};

export default StakingInputBlock;
