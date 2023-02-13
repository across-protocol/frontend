import Footer from "components/Footer";
import { Text } from "components/Text";
import { TertiaryButton } from "components/Buttons";
import Sentry from "utils/sentry";

import { Wrapper, InnerWrapper, ButtonsWrapper } from "./ErrorBoundary.styles";

export function FallbackComponent() {
  return (
    <Wrapper>
      <InnerWrapper>
        <Text size="3xl" color="white">
          Something went wrong
        </Text>
        <Text>
          Sorry, an error occurred. We've been notified about this issue and
          we'll take a look at it shortly.
        </Text>
        <Text>
          You can also try reloading the page, request support on Discord or
          come back later.
        </Text>
        <ButtonsWrapper>
          <TertiaryButton size="sm" onClick={() => window.location.reload()}>
            Reload
          </TertiaryButton>
          <a href="https://discord.across.to" target="_blank" rel="noreferrer">
            <TertiaryButton size="sm">Discord</TertiaryButton>
          </a>
        </ButtonsWrapper>
      </InnerWrapper>
      <Footer />
    </Wrapper>
  );
}

export function ErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={FallbackComponent}
      beforeCapture={(scope) => scope.setLevel("fatal")}
    >
      {props.children}
    </Sentry.ErrorBoundary>
  );
}
