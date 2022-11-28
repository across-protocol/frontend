import { BigNumber } from "ethers";
import { parseEtherLike } from "utils/format";

import { getBaseRewardsApr } from "../rewards";

describe("#getBaseRewardsApr", () => {
  const totalBaseRewardsPerYear = BigNumber.from(1);

  test("return base rewards APR of 100%", () => {
    const totalStaked = totalBaseRewardsPerYear;
    expect(
      getBaseRewardsApr(totalBaseRewardsPerYear, totalStaked)
    ).toMatchObject(parseEtherLike("1"));
  });

  test("return base rewards APR of 50%", () => {
    const totalStaked = totalBaseRewardsPerYear.mul(2);
    expect(
      getBaseRewardsApr(totalBaseRewardsPerYear, totalStaked)
    ).toMatchObject(parseEtherLike("0.5"));
  });
});
