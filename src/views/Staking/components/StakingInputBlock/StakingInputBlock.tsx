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
  onClickHandler,
  displayLoader,
}) => {
  return (
    <InputRow>
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
        <MaxButton disabled={displayLoader} onClick={() => setValue(maxValue)}>
          Max
        </MaxButton>
      </InputWrapper>
      <ButtonWrapper>
        <StakeButton
          valid={valid}
          disabled={!valid || displayLoader}
          onClick={onClickHandler}
        >
          {capitalizeFirstLetter(buttonText)}
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  );
};

export default StakingInputBlock;
