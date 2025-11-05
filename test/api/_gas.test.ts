import { BigNumber } from "ethers";

import { assertDestinationGasBelowLimit } from "../../api/_gas";
import { CHAIN_IDs } from "../../api/_constants";

describe("assertDestinationGasBelowLimit", () => {
  it("allows gas usage within the configured limit", () => {
    expect(() =>
      assertDestinationGasBelowLimit({
        destinationChainId: CHAIN_IDs.HYPEREVM,
        gasUnits: BigNumber.from(2_000_000),
      })
    ).not.toThrow();
  });

  it("throws when the gas usage exceeds the configured limit", () => {
    expect(() =>
      assertDestinationGasBelowLimit({
        destinationChainId: CHAIN_IDs.HYPEREVM,
        gasUnits: BigNumber.from(2_000_001),
      })
    ).toThrow(`Gas for destination chain 999 exceeds the limit of 2000000`);
  });
});
