import React, { useContext } from "react";
import { useState, useCallback, createContext } from "react";

type ExtendedError = Error;
type ErrorContextValue = {
  error: ExtendedError | undefined;
  addError: (message: Error) => void;
  removeError: () => void;
};

function useErrorManager() {
  const [error, setError] = useState<Error | undefined>(undefined);
  const removeError = useCallback(() => setError(undefined), []);
  const addError = useCallback(
    (error: ExtendedError | undefined) => setError(error),
    []
  );

  return {
    error,
    addError,
    removeError,
  };
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);
ErrorContext.displayName = "ErrorContext";
export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useErrorManager();
  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
};

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an <ErrorProvider>");
  }
  return context;
}
