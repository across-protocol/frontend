import { Preview } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { default as GlobalStyles } from "../src/components/GlobalStyles/GlobalStyles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "../src/providers/wallet/WalletProvider";

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <WalletProvider>
          <QueryClientProvider client={new QueryClient()}>
            <GlobalStyles />
            <Story />
          </QueryClientProvider>
        </WalletProvider>
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
