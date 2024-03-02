import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "hooks";
import { isDefined } from "utils";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();

  // Default to referrer if query ref isn't provided.
  const r = refParam || referrer;

  const [address, setAddress] = useState<string>("");
  const [isResolved, setIsResolved] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, error, isResolved };
}
