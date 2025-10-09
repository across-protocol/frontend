/**
 * This file re-exports some of the typechain factories so that they can be tree-shaken in the final frontend bundle.
 * Currently, the packages `@across-protocol/contracts` and `@across-protocol/across-token` are not optimized for tree-shaking.
 * This is a temporary solution until we can fix the issue upstream.
 */
export { AcrossMerkleDistributor__factory } from "@across-protocol/contracts/dist/typechain/factories/contracts/merkle-distributor/AcrossMerkleDistributor__factory";
export { HubPool__factory } from "@across-protocol/contracts/dist/typechain/factories/contracts/HubPool__factory";
export { SpokePool__factory } from "@across-protocol/contracts/dist/typechain/factories/contracts/SpokePool__factory";
export { SpokePoolVerifier__factory } from "@across-protocol/contracts/dist/typechain/factories/contracts/SpokePoolVerifier__factory";
export { ERC20__factory } from "@across-protocol/contracts/dist/typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory";
export { AcceleratingDistributor__factory } from "@across-protocol/across-token/dist/typechain/factories/AcceleratingDistributor__factory";
export { ClaimAndStake__factory } from "@across-protocol/across-token/dist/typechain/factories/ClaimAndStake__factory";

// NOTE: SwapAndBridge and UniverslSwapAndBridge were removed in version 4.1.3 of the contracts repo
// We need version 4.1.1 until we migrate to new SpokePoolPeriphery contracts.
export { UniversalSwapAndBridge__factory } from "@across-protocol/contracts-v4.1.1/dist/typechain/factories/contracts/SwapAndBridge.sol/UniversalSwapAndBridge__factory";
export { SwapAndBridge__factory } from "@across-protocol/contracts-v4.1.1/dist/typechain/factories/contracts/SwapAndBridge.sol/SwapAndBridge__factory";
export type {
  UniversalSwapAndBridge,
  SwapAndBridge,
} from "@across-protocol/contracts-v4.1.1/dist/typechain/contracts/SwapAndBridge.sol";

export type { AcrossMerkleDistributor } from "@across-protocol/contracts/dist/typechain/contracts/merkle-distributor/AcrossMerkleDistributor";
export type { HubPool } from "@across-protocol/contracts/dist/typechain/contracts/HubPool";
export type {
  SpokePool,
  FilledV3RelayEvent,
} from "@across-protocol/contracts/dist/typechain/contracts/SpokePool";
export type { SpokePoolVerifier } from "@across-protocol/contracts/dist/typechain/contracts/SpokePoolVerifier";
export type { AcceleratingDistributor } from "@across-protocol/across-token/dist/typechain/AcceleratingDistributor";
export type { ClaimAndStake } from "@across-protocol/across-token/dist/typechain/ClaimAndStake";
export type {
  TypedEvent,
  TypedEventFilter,
} from "@across-protocol/contracts/dist/typechain/common";
export type { TransferEvent } from "@across-protocol/contracts/dist/typechain/@openzeppelin/contracts/token/ERC20/ERC20";
