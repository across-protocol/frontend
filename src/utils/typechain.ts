/**
 * This file re-exports some of the typechain factories so that they can be tree-shaken in the final frontend bundle.
 * Currently, the packages `@across-protocol/contracts-v2` and `@across-protocol/across-token` are not optimized for tree-shaking.
 * This is a temporary solution until we can fix the issue upstream.
 */
export { AcrossMerkleDistributor__factory } from "@across-protocol/contracts-v2/dist/typechain/factories/AcrossMerkleDistributor__factory";
export { HubPool__factory } from "@across-protocol/contracts-v2/dist/typechain/factories/HubPool__factory";
export { SpokePool__factory } from "@across-protocol/contracts-v2/dist/typechain/factories/SpokePool__factory";
export { ERC20__factory } from "@across-protocol/contracts-v2/dist/typechain/factories/ERC20__factory";
export { AcceleratingDistributor__factory } from "@across-protocol/across-token/dist/typechain/factories/AcceleratingDistributor__factory";
export { ClaimAndStake__factory } from "@across-protocol/across-token/dist/typechain/factories/ClaimAndStake__factory";

export type { AcrossMerkleDistributor } from "@across-protocol/contracts-v2/dist/typechain/AcrossMerkleDistributor";
export type { HubPool } from "@across-protocol/contracts-v2/dist/typechain/HubPool";
export type { SpokePool } from "@across-protocol/contracts-v2/dist/typechain/SpokePool";
export type { AcceleratingDistributor } from "@across-protocol/across-token/dist/typechain/AcceleratingDistributor";
export type { ClaimAndStake } from "@across-protocol/across-token/dist/typechain/ClaimAndStake";
