# Across v2 frontend

<a href="https://discord.gg/across" target="_blank" rel="noreferrer">![](https://img.shields.io/badge/Chat%20on-Discord-%235766f2)</a>
<a href="https://forum.across.to/" target="_blank" rel="noreferrer">![](https://img.shields.io/discourse/status?server=https%3A%2F%2Fforum.across.to%2F)</a>
<a href="https://twitter.com/AcrossProtocol/" target="_blank" rel="noreferrer">![](https://img.shields.io/twitter/follow/AcrossProtocol?style=social)</a>

Web UI for V2 of the Across Protocol.

- App: https://across.to
- Docs: https://docs.across.to
- Medium: https://medium.com/across-protocol

## Development

### Local setup

Clone this repository, install deps and create an `.env.local` file by running:

```bash
yarn
cp .env.example .env.local
```

Adjust values in the created `.env.local` accordingly.

### Start dev server

Start the frontend with a dev server by running:

```bash
yarn start
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

Our e2e tests rely on a local hardhat node that forks mainnet.
First, set the env var `HARDHAT_INFURA_ID` in your `.env` file and make sure to run such a node before starting the tests:

```bash
yarn hardhat:node
```

We use [cypress](https://docs.cypress.io/guides/overview/why-cypress) for handling e2e tests.
To run the tests locally, first make sure to have a local dev sever running:

```bash
yarn start
```

If you want to start the cypress UI run:

```bash
yarn cypress:open
```

If you want to run the tests from the CLI, run:

```bash
yarn cypress:run
```

Per default cypress expects the frontend running on `http://localhost:3000`.
To change that run:

```bash
CYPRESS_BASE_URL=http://localhost:3333 yarn cypress:run
```

### Important CSS values

#### Z-index

Navbar - 1000
Toast - 99999
Modal - 99998

## Contributing

Have a look at [CONTRIBUTING](./CONTRIBUTING.md) to get more information on contributions and best practices.

## Pull Data from Amplitude

The `src/ampli` directory can be refreshed with new tracking data by running the following steps:

1. Run `yarn ampli login` to log in to Amplitude
2. Run `yarn ampli pull web`
   1. If Amplitude requests to create a new project, let it generate a `ampli.json` file.
