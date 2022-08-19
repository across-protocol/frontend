import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  UsdcLogo,
  MaxButton,
} from "./StakingForm.styles";
import { capitalizeFirstLetter } from "utils/format";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  valid: boolean;
  buttonText: string;
}
const StakingInputWrapper: React.FC<Props> = ({
  value,
  setValue,
  valid,
  buttonText,
}) => {
  return (
    <InputRow>
      <InputWrapper>
        <UsdcLogo />
        <Input
          placeholder="Enter amount"
          value={value}
          type="text"
          onChange={(e) => setValue(e.target.value)}
        />
        <MaxButton>Max</MaxButton>
      </InputWrapper>
      <ButtonWrapper>
        <StakeButton valid={valid}>
          {capitalizeFirstLetter(buttonText)}
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  );
};

export default StakingInputWrapper;
