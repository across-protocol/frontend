import { Buffer } from "buffer";
import { addDecorator } from "@storybook/react";
import { GlobalStyles } from "components";

window.Buffer = Buffer;
addDecorator(s => <><GlobalStyles />{s()}</>);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
