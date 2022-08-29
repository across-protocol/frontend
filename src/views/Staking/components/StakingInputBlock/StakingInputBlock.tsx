import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  MaxButton,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import { StylizedSVG } from "../../types";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  valid: boolean;
  buttonText: string;
  Logo: StylizedSVG;
  maxValue: string;
  omitInput?: boolean;
  onClickHandler: () => void;
  displayLoader?: boolean;
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
}) => {
  return (
    <InputRow>
      {!omitInput && (
        <InputWrapper>
          <Logo />
          <Input
            placeholder="Enter amount"
            value={value}
            type="text"
            onChange={(e) => setValue(e.target.value)}
            valid={!value || valid}
            disabled={displayLoader}
          />
          <MaxButton
            disabled={displayLoader}
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
          {capitalizeFirstLetter(buttonText)}
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  );
};

export default StakingInputBlock;
