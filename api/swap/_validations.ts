import * as sdk from "@across-protocol/sdk";

import { InvalidParamError } from "../_errors";

export function assertValidAddressChainCombination(params: {
  address: string;
  chainId: number;
  paramName: string;
}) {
  const { address, chainId, paramName } = params;
  const addressType = sdk.utils.toAddressType(address, chainId);

  if (sdk.utils.chainIsSvm(chainId) && !addressType.isSVM()) {
    throw new InvalidParamError({
      param: paramName,
      message: `'${paramName}' must be a valid SVM address`,
    });
  }
  if (sdk.utils.chainIsEvm(chainId) && !addressType.isEVM()) {
    throw new InvalidParamError({
      param: paramName,
      message: `'${paramName}' must be a valid EVM address`,
    });
  }
}
