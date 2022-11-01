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
import { Alert } from "components";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  valid: boolean;
  buttonText: string;
  logoURI: string;
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
  logoURI,
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
          <TokenIcon src={logoURI} />
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
      <Alert status="danger">{errorMessage}</Alert>
    )}
  </Wrapper>
);

export default StakingInputBlock;
