# Across frontend

<a href="https://discord.across.to" target="_blank" rel="noreferrer">![](https://img.shields.io/badge/Chat%20on-Discord-%235766f2)</a>
<a href="https://forum.across.to/" target="_blank" rel="noreferrer">![](https://img.shields.io/discourse/status?server=https%3A%2F%2Fforum.across.to%2F)</a>
<a href="https://twitter.com/AcrossProtocol/" target="_blank" rel="noreferrer">![](https://img.shields.io/twitter/follow/AcrossProtocol?style=social)</a>

Web UI for Across.

- App: https://app.across.to
- Docs: https://docs.across.to
- Medium: https://medium.com/across-protocol

## Development

### Requirements

- [yarn v1.22.22](https://classic.yarnpkg.com/en/docs/install)
- NodeJS >=v18
- [Vercel CLI](https://vercel.com/docs/cli)

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
PORT=3000 yarn dev
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

## Pull Data from Amplitude

The `src/ampli` directory can be refreshed with new tracking data by running the following steps:

1. Run `yarn ampli login` to log in to Amplitude
2. Run `yarn ampli pull web`
   1. If Amplitude requests to create a new project, let it generate a `ampli.json` file.

## Contributing

Have a look at [CONTRIBUTING](./CONTRIBUTING.md) to get more information on contributions and best practices.
