# Helper scripts

The folder `<ROOT>/scripts` contains multiple scripts that help generating code, data and e2e tests:

- `generate-routes.ts`
  - This scripts generates a static `routes_<HUB_CHAIN>_<HUB_ADDRESS>.json` in `src/data` that is used in the API and in the FE. The file contains information on configured contracts and enabled routes.
- `generate-chain-config.ts`
  - This script is used when adding support for a new chain. It scaffolds file in `scripts/chain-configs`.
- `generate-ui-assets.ts`
  - This script generates code from `scripts/chain-configs` into a format required by the FE.

## Guides

### How to add a new chain

The following guide shows the required steps to add a new chain. As an example, we use [Blast]().

1. Run from the root of the project

```bash
yarn generate:chain-config blast
```

2. Add chain logos (normal and grayscale) to [`scripts/chain-configs/blast/assets`](./chain-configs/blast/assets).

3. Edit [`scripts/chain-configs/blast/index.ts`](./chain-configs/blast/index.ts).

4. Enable the added chain in [`scripts/generate-routes.ts`](./generate-routes.ts)

```diff
const enabledMainnetChainConfigs = [
  chainConfigs.MAINNET,
  chainConfigs.OPTIMISM,
  chainConfigs.POLYGON,
  chainConfigs.ARBITRUM,
  chainConfigs.ZK_SYNC,
  chainConfigs.BASE,
  chainConfigs.LINEA,
  chainConfigs.MODE,
  chainConfigs.LISK,
+ chainConfigs.BLAST
];
```

4. Run from the root of the project

```bash
yarn generate:routes:mainnet
```

5. Generate UI assets

```bash
yarn generate:ui-assets
```

6. Enable new chain in [`src/constants/index.ts`](../src/constants/chains/index.ts)

```diff
const orderedEnabledChainIds = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.ZK_SYNC,
  CHAIN_IDs.BASE,
  CHAIN_IDs.LINEA,
  CHAIN_IDs.MODE,
  CHAIN_IDs.LISK,
+ CHAIN_IDs.BLAST,
  // ...
];
```
