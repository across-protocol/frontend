import { Buffer } from "buffer";
import { addDecorator } from "@storybook/react";
import { default as GlobalStyles } from "components/GlobalStyles/GlobalStyles";
import { OnboardContext, useOnboardManager } from "hooks/useOnboard";

import { MemoryRouter } from "react-router";
addDecorator((story) => (
  <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>
));

window.Buffer = Buffer;
addDecorator((s) => (
  <>
    <GlobalStyles />
    {s()}
  </>
));

const OnboardDecorator = (storyFn) => {
  const value = useOnboardManager();
  return (
    <OnboardContext.Provider value={value}>{storyFn()}</OnboardContext.Provider>
  );
};

addDecorator(OnboardDecorator);
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
