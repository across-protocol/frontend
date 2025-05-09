import { Preview } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { default as GlobalStyles } from "../src/components/GlobalStyles/GlobalStyles";

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <GlobalStyles />
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
