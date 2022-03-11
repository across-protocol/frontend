// For getting the ref of a value.
// If you need to know what the previous value of any state variable you're tracking
// Pass it into here and you can do a comparison to the current value.
// IE: const prevValue = useRef(value) === value ? x : y;

import { useEffect, useRef } from "react";

/**
 * For getting the ref of a value.
 * 
 * If you need to know what the previous value of any state variable you're tracking, pass it into here and you can do a comparison to the current value.
 * @param value The value to track
 * @returns The value at the previous render. 
 * @example const prevValue = useRef(value) === value ? x : y;
 */
export function usePrevious<T>(value: T): T {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
