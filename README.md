# Across v2 frontend

<a href="https://discord.gg/across" target="_blank" rel="noreferrer">![](https://img.shields.io/badge/Chat%20on-Discord-%235766f2)</a>
<a href="https://forum.across.to/" target="_blank" rel="noreferrer">![](https://img.shields.io/discourse/status?server=https%3A%2F%2Fforum.across.to%2F)</a>
<a href="https://twitter.com/AcrossProtocol/" target="_blank" rel="noreferrer">![](https://img.shields.io/twitter/follow/AcrossProtocol?style=social)</a>

Web UI for V2 of the Across Protocol.

- App: https://across.to
- Docs: https://docs.across.to/v2
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

### Run integration tests

We use [cypress](https://docs.cypress.io/guides/overview/why-cypress) for handling integration tests.
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

### Important CSS values

#### Z-index

Navbar - 1000

## Contributing

Have a look at [CONTRIBUTING](./CONTRIBUTING.md) to get more information on contributions and best practices.
