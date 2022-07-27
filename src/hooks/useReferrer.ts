import { useQueryParams } from "./useQueryParams";

export default function useReferrer() {
  const { referrer, ref: refParam } = useQueryParams();
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  let r = referrer || refParam;
  return r;
}
