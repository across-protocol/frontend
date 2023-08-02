import {
  InputRow,
  ButtonWrapper,
  StakeButton,
  Wrapper,
  LoaderWrapper,
  StakeButtonContentWrapper,
  Input,
  InputWrapper,
  MaxButton,
  TokenIcon,
  IconPairContainer,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import { trackMaxButtonClicked } from "utils";
import { useAmplitude } from "hooks";
import { IconPair } from "components/IconPair";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  valid: boolean;
  invalid: boolean;
  buttonText: string;
  logoURI: string;
  logoURIs?: [string, string];
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
  logoURIs,
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
      <InputRow>
        <InputWrapper valid={valid} invalid={invalid}>
          {logoURIs ? (
            <IconPairContainer>
              <IconPair
                LeftIcon={<TokenIcon src={logoURIs[0]} />}
                RightIcon={<TokenIcon src={logoURIs[1]} />}
              />
            </IconPairContainer>
          ) : (
            <TokenIcon src={logoURI} />
          )}
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
              addToAmpliQueue(() => {
                trackMaxButtonClicked(
                  stakingAction === "stake" ? "stakeForm" : "unstakeForm"
                );
              });
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
};

export default StakingInputBlock;
