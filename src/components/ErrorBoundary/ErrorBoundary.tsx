import Footer from "components/Footer";
import { Text } from "components/Text";
import { TertiaryButton } from "components/Buttons";
import Sentry from "utils/sentry";

import { Wrapper, InnerWrapper, ButtonsWrapper } from "./ErrorBoundary.styles";

export function FallbackComponent(props: { error: Error }) {
  return (
    <Wrapper>
      <InnerWrapper>
        <Text size="3xl" color="white">
          Something went wrong
        </Text>
        <Text>Sorry, an error occurred.</Text>
        <code>
          {props.error.name}: {props.error.message}
        </code>
        <Text>
          We've been notified about this issue and we'll take a look at it
          shortly.
        </Text>
        <Text>
          You can also try reloading the page, request support on Discord or
          come back later.
        </Text>
        <ButtonsWrapper>
          <TertiaryButton size="sm" onClick={() => window.location.reload()}>
            Reload
          </TertiaryButton>
          <TertiaryButton
            size="sm"
            onClick={() => window.open("https://discord.across.to", "_blank")}
          >
            Discord
          </TertiaryButton>
        </ButtonsWrapper>
      </InnerWrapper>
      <Footer />
    </Wrapper>
  );
}

export function ErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => <FallbackComponent error={error} />}
      beforeCapture={(scope) => scope.setLevel("fatal")}
    >
      {props.children}
    </Sentry.ErrorBoundary>
  );
}
