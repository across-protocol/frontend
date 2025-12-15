import { useRef, useEffect, ChangeEvent, forwardRef } from "react";
import { TokenAmountInput } from "./styles";
import {
  formatNumberWithSeparators,
  parseFormattedNumber,
  calculateCursorPosition,
} from "utils/format";

interface FormattedTokenInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (rawValue: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error: boolean;
  maxDecimals?: number;
  "data-testid"?: string;
}

export const FormattedTokenInput = forwardRef<
  HTMLInputElement,
  FormattedTokenInputProps
>(
  (
    {
      id,
      name,
      value,
      onChange,
      onFocus,
      onBlur,
      placeholder = "0.00",
      disabled = false,
      error,
      maxDecimals = 18,
      "data-testid": dataTestId,
    },
    forwardedRef
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const lastValueRef = useRef<string>(value);
    const lastCursorRef = useRef<number>(0);

    useEffect(() => {
      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(inputRef.current);
        } else {
          forwardedRef.current = inputRef.current;
        }
      }
    }, [forwardedRef]);

    useEffect(() => {
      lastValueRef.current = value;
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const newRawValue = input.value;
      const cursorPosition = input.selectionStart || 0;

      lastCursorRef.current = cursorPosition;

      const unformatted = parseFormattedNumber(newRawValue);

      if (unformatted && !/^\d*\.?\d*$/.test(unformatted)) {
        return;
      }

      onChange(unformatted);
    };

    useEffect(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        const input = inputRef.current;

        if (lastValueRef.current !== value) {
          const wasDeleting = value.length < lastValueRef.current.length;
          const newCursor = calculateCursorPosition(
            lastValueRef.current,
            value,
            lastCursorRef.current,
            wasDeleting
          );

          input.setSelectionRange(newCursor, newCursor);
        }
      }
    }, [value]);

    return (
      <TokenAmountInput
        ref={inputRef}
        id={id}
        name={name}
        data-testid={dataTestId}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        error={error}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
    );
  }
);

FormattedTokenInput.displayName = "FormattedTokenInput";
