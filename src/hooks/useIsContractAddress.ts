import { useState, useEffect } from "react";

import { getCode, noContractCode } from "utils";

export function useIsContractAddress(address?: string, chainId = 1) {
  const [isContractAddress, setIsContractAddress] = useState(false);

  useEffect(() => {
    if (address && chainId) {
      getCode(address, chainId)
        .then((res) => {
          setIsContractAddress(res !== noContractCode);
        })
        .catch((err) => {
          console.log("err in getCode call", err);
        });
    } else {
      setIsContractAddress(false);
    }
  }, [address, chainId]);

  return isContractAddress;
}
