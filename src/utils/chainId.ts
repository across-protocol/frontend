export type ValidChainId = 1 | 42 | 1337 | 10;
export type ChainId = 1 | 42 | 1337 | 3 | 4 | 10;

export function isValidChainId(chainId: number): chainId is ValidChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

export const SUPPORTED_CHAIN_IDS = [1, 10, 42, 1337];

export class UnsupportedChainIdError extends Error {
  public constructor(
    unsupportedChainId: number,
    supportedChainIds?: readonly number[]
  ) {
    super();
    this.name = this.constructor.name;
    this.message = `Unsupported chain id: ${unsupportedChainId}. Supported chain ids are: ${supportedChainIds}.`;
  }
}
