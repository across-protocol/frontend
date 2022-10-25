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
import { useSplash } from "./useSplash";
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
                Bridge Across.
                <GradientTitleSegment>
                  Fast. Cheap. Secure.
                </GradientTitleSegment>
              </TitleText>
              <DescriptionText size="lg" color="white-88">
                Across offers the fastest, cheapest and most secure bridging
                experience on the Ethereum blockchain today.
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
