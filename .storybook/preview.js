import { Buffer } from "buffer";
import { addDecorator } from "@storybook/react";
import { GlobalStyles } from "components";
import { MemoryRouter } from "react-router";

window.Buffer = Buffer;
addDecorator(story => <><GlobalStyles />{story()}</>);
addDecorator(story => <MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>);

addDecorator(story => <><GlobalStyles />{story()}</>);
addDecorator(story => <MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
