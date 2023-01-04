import {
  InputRow,
  ButtonWrapper,
  StakeButton,
  Wrapper,
  LoaderWrapper,
  StakeButtonContentWrapper,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import InputWithMaxButton from "components/InputWithMaxButton";

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
}) => (
  <Wrapper>
    <InputRow>
      <InputWithMaxButton
        valid={valid}
        invalid={invalid}
        value={value}
        onChangeValue={(e) => setValue(e.target.value)}
        disableInput={displayLoader || disableInput}
        onEnterKeyDown={onClickHandler}
        onClickMaxButton={() => setValue(maxValue ?? "")}
        maxValue={maxValue}
        logoURI={logoURI}
      />

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
