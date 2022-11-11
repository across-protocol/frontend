import { LayoutV2 } from "components";
import { Text } from "components/Text";
import { ReactComponent as ExternalLink } from "assets/icons/external-link-16.svg";
import {
  Wrapper,
  TitleSegment,
  TitleDescriptionWrapper,
  TitleText,
  GradientTitleSegment,
  DescriptionText,
  ButtonWrapper,
  BridgeButton,
  ButtonText,
  DocButton,
  NumericBenefitWrapper,
  ExternalWrapper,
  CardBenefitWrapper,
} from "./Splash.styles";
import { useSplash } from "./hooks/useSplash";
import NumericBenefit from "./components/NumericBenefit";
import CardBenefit from "./components/CardBenefit";

const Splash = () => {
  const { numericBenefits, cardBenefits } = useSplash();
  return (
    <ExternalWrapper>
      <LayoutV2 maxWidth={1140}>
        <Wrapper>
          <TitleSegment>
            <TitleDescriptionWrapper>
              <TitleText>
                Across
                <GradientTitleSegment>
                  The Bridge Ethereum Deserves
                </GradientTitleSegment>
              </TitleText>
              <DescriptionText size="lg" color="white-88">
                Across is a capital efficient and optimistic bridge that
                connects the EVM ecosystem.
              </DescriptionText>
            </TitleDescriptionWrapper>
            <ButtonWrapper>
              <BridgeButton to="/bridge">
                <ButtonText size="lg">Go to Bridge</ButtonText>
              </BridgeButton>
              <DocButton href="https://docs.across.to/v2/">
                <Text color="white-100" size="lg">
                  Read docs
                </Text>
                <ExternalLink />
              </DocButton>
            </ButtonWrapper>
          </TitleSegment>
          <NumericBenefitWrapper>
            {numericBenefits.map(({ title, value }) => (
              <NumericBenefit key={title} title={title} value={value} />
            ))}
          </NumericBenefitWrapper>
          <CardBenefitWrapper>
            {cardBenefits.map(({ title, description, icon }) => (
              <CardBenefit
                title={title}
                description={description}
                icon={icon}
                key={title}
              />
            ))}
          </CardBenefitWrapper>
        </Wrapper>
      </LayoutV2>
    </ExternalWrapper>
  );
};

export default Splash;
