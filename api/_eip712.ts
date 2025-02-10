import { utils } from "ethers";

export function hashDomainSeparator(params: {
  name: string;
  version: string | number;
  chainId: number;
  verifyingContract: string;
}): string {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        utils.id(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        utils.id(params.name),
        utils.id(params.version.toString()),
        params.chainId,
        params.verifyingContract,
      ]
    )
  );
}
