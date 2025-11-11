# Across frontend

<a href="https://discord.across.to" target="_blank" rel="noreferrer">![](https://img.shields.io/badge/Chat%20on-Discord-%235766f2)</a>
<a href="https://forum.across.to/" target="_blank" rel="noreferrer">![](https://img.shields.io/discourse/status?server=https%3A%2F%2Fforum.across.to%2F)</a>
<a href="https://twitter.com/AcrossProtocol/" target="_blank" rel="noreferrer">![](https://img.shields.io/twitter/follow/AcrossProtocol?style=social)</a>

Web UI for Across.

- App: <https://app.across.to>
- Docs: <https://docs.across.to>
- Medium: <https://medium.com/across-protocol>

## Development

### Requirements

- [yarn v1.22.22](https://classic.yarnpkg.com/en/docs/install)
- NodeJS >=v20
- [Vercel CLI (35 or higher)](https://vercel.com/docs/cli)

### Local setup

Clone this repository, install deps and create an `.env` file by running:

```bash
yarn
cp .env.example .env
```

Adjust values in the created `.env` accordingly.

### Start dev server

Start the frontend with a dev server by running:

```bash
PORT=3000 vercel dev
```

### Build production bundle

```bash
yarn build
```

### Run unit tests

```bash
yarn test
```

### Run e2e tests

Our e2e tests use [Playwright](https://playwright.dev/) and [Synpress](https://synpress.io/). You can configure some custom env vars for running e2e tests by creating a file `.env.e2e` that might have the following content:

```bash
# This will default to http://127.0.0.1:3000 but can be overridden to target a different deployment
E2E_DAPP_URL=
# Seed phrase to use for MetaMask when running e2e tests
E2E_MM_SEED_PHRASE=
# Password to use for MetaMask when running e2e tests
E2E_MM_PASSWORD=
# Custom Infura project id to use when running e2e tests
E2E_INFURA_ID=
```

To run the tests locally, first make sure to have a local dev sever running:

```bash
PORT=3000 yarn dev
```

Make sure to setup the wallet cache by running

```bash
yarn synpress ./e2e/wallet-setup
```

If you want to start the Playwright UI run:

```bash
yarn test:e2e:headless:ui
```

If you want to run the tests from the CLI, run:

```bash
yarn test:e2e:headless
```

## Swap API Testing

### Prerequisites

First, make sure you have all dependencies installed by running:

```bash
yarn install
```

You will also need a `.env.e2e` file. You can copy the example file and fill in the values:

```bash
cp .env.example .env.e2e
```

The `.env.e2e` file needs to contain the following keys. You can get the values for these keys from our shared Keeper account at https://www.keepersecurity.com/.

```
E2E_TESTS_SWAP_API_BASE_URL=
REACT_APP_VERCEL_API_BASE_URL_OVERRIDE=
E2E_RPC_URL_1=
E2E_RPC_URL_10=
E2E_RPC_URL_8453=
```

### Unit Tests

The unit tests for the swap API are located in the `./test/api` directory. You can run them using the following command:

```bash
yarn test-api
```

### End-to-End (E2E) Tests

Running the E2E tests is a bit more involved.

If you have made changes to the server code, you will need to commit your changes and push them to a branch on GitHub. This will trigger a GitHub Action that deploys the changes to a preview environment on Vercel.

To start the GitHub Action, you can create a pull request with your changes. The `API E2E Tests` workflow will automatically run on a successful deployment of your pull request.

This workflow, defined in `.github/workflows/e2e-api.yaml`, runs the E2E tests against the deployed preview environment.

Once the deployment is successful, you can find the URL of the preview deployment on your pull request page or on the Vercel deployments page: https://vercel.com/uma/app-frontend-v3/deployments. You will need to update the following values in your `.env.e2e` file with this URL:

-   `E2E_TESTS_SWAP_API_BASE_URL`
-   `REACT_APP_VERCEL_API_BASE_URL_OVERRIDE`

After updating the `.env.e2e` file, you can run the E2E tests with the following command:

```bash
yarn test:e2e-api
```

#### Manual Trigger

You can also manually trigger the `API E2E Tests` workflow. This is useful if you want to run the tests against a specific deployment without creating a pull request.

To manually trigger the workflow:

1.  Go to the "Actions" tab in the GitHub repository.
2.  Select the "API E2E Tests" workflow from the list of workflows.
3.  Click on the "Run workflow" dropdown button.
4.  You will see an input field to provide the deployment URL you want to test against.
5.  Click the "Run workflow" button to start the workflow.

You can find the Vercel deployments here: https://vercel.com/uma/app-frontend-v3/deployments

### Manual Tests

There are also manual tests that you can run. These tests will perform actual executions of swaps or bridging and are thus not suited for CI triggered testing.

**Prerequisites**

1.  Create a `.env` file with a `DEV_WALLET_PRIVATE_KEY`. You can get this from Keeper.

    ```
    DEV_WALLET_PRIVATE_KEY=****************************************************************
    ```

2.  [OPTIONAL] Update the `rpc-providers.json` file in `/src/data/rpc-providers.json` with your Alchemy key for the providers. You can also get this from Keeper. This step is optional but will improve reliability and speed of the tests.

3.  Start the local development server:

    ```bash
    yarn dev:api
    ```

**Running the Tests**

To run the manual tests, you use the `yarn tsx scripts/tests/swap.ts` command, which accepts various options and subcommands.

#### Options for `swap.ts` (base command)

These options apply directly to the `swap.ts` command without any subcommand.

| Option                     | Alias | Description                           | Default                     |
| -------------------------- | ----- | ------------------------------------- | --------------------------- |
| `--includeDestinationAction` | `da`  | Include destination action.           | `false`                     |
| `--host`                   | `h`   | Host to use for the API               | `http://localhost:3000`     |
| `--flowType`               | `ft`  | Flow type.                            | `approval`                  |
| `--skipTxExecution`        | `ste` | Skip tx execution.                    | `false`                     |

#### Options for `swap.ts args` (run with custom arguments)

Use this subcommand to run a single test with custom parameters.

Example:
```bash
yarn tsx ./scripts/tests/swap.ts args --originChainId 1 --destinationChainId 42161 --inputToken 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 --outputToken 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 --amount 1000000
```

| Option                 | Alias | Description                                         | Default                                                |
| ---------------------- | ----- | --------------------------------------------------- | ------------------------------------------------------ |
| `originChainId`        | `oc`  | Origin chain ID.                                    | `10`                                                   |
| `destinationChainId`   | `dc`  | Destination chain ID.                               | `8453`                                                 |
| `inputToken`           | `it`  | Input token address.                                | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`           |
| `outputToken`          | `ot`  | Output token address.                               | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`           |
| `amount`               | `a`   | Amount of input token.                              | `1000000`                                              |
| `slippage`             | `s`   | Slippage tolerance. 0 <= slippage <= 1, 0.01 = 1%   |                                                        |
| `tradeType`            | `tt`  | Trade type.                                         | `exactInput`                                           |
| `recipient`            | `r`   | Recipient address.                                  |                                                        |
| `depositor`            | `d`   | Depositor address.                                  | `0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D`           |
| `refundAddress`        | `ra`  | Refund address.                                     |                                                        |
| `refundOnOrigin`       | `ro`  | Refund on origin.                                   | `false`                                                |
| `skipOriginTxEstimation` | `sote`| Skip origin tx estimation.                        | `false`                                                |
| `integratorId`         | `i`   | Integrator ID.                                      |                                                        |
| `includeSources`       | `is`  | Comma-separated list of sources to include.         |                                                        |
| `excludeSources`       | `es`  | Comma-separated list of sources to exclude.         |                                                        |
| `appFee`               | `apf` | App fee percent. 0 <= appFee <= 1, 0.01 = 1%        |                                                        |
| `appFeeRecipient`      | `apr` | App fee recipient.                                  |                                                        |
| `strictTradeType`      | `stt` | Strict trade type.                                  | `true`                                                 |

#### Options for `swap.ts test-cases` (run predefined test cases)

Use this subcommand to run predefined test cases from `scripts/tests/_swap-cases.ts`.

Example:
```bash
yarn tsx scripts/tests/swap.ts test-cases --filter "B2B,MIN_OUTPUT"
```

| Option                     | Alias | Description                                                               | Default                     |
| -------------------------- | ----- | ------------------------------------------------------------------------- | --------------------------- |
| `--filter`                 | `f`   | Filter predefined test cases in `scripts/tests/_swap-cases.ts` by comma-separated list of labels. |                             |

You can customize which tests to run by editing the `scripts/tests/_swap-utils.ts` and `scripts/tests/_swap-cases.ts` files.

-   In `scripts/tests/_swap-utils.ts`, you can filter test cases by label.
-   In `scripts/tests/_swap-cases.ts`, you can edit or add new swap or bridging tests.

## Pull Data from Amplitude

The `src/ampli` directory can be refreshed with new tracking data by running the following steps:

1. Run `yarn ampli login` to log in to Amplitude
2. Run `yarn ampli pull web`
   1. If Amplitude requests to create a new project, let it generate a `ampli.json` file.

## Contributing

Have a look at [CONTRIBUTING](./CONTRIBUTING.md) to get more information on contributions and best practices.
