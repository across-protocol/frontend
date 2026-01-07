import * as poolClient from "../src/pool/poolClient";
import { BigNumber } from "../src/utils";
import { expect } from "./utils";

describe("poolClient", function () {
  it("previewRemoval", function () {
    const user = {
      address: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      lpTokens: "900000000000000000",
      positionValue: "900000541941830509",
      totalDeposited: "900000000000000000",
      feesEarned: "541941830509",
    };
    const result = poolClient.previewRemoval(user, 0.75);

    expect(
      BigNumber.from(result.total.receive).add(result.total.remain).toString()
    ).to.be.eq(user.positionValue);
    expect(
      BigNumber.from(result.position.receive)
        .add(result.position.remain)
        .toString()
    ).to.be.eq(user.totalDeposited);
    expect(
      BigNumber.from(result.fees.receive).add(result.fees.remain).toString()
    ).to.be.eq(user.feesEarned);
  });
});
