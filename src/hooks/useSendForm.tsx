import {
  useReducer,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from "react";
import { ethers } from "ethers";
import {
  ChainId,
  DEFAULT_FROM_CHAIN_ID,
  DEFAULT_TO_CHAIN_ID,
  CHAINS_SELECTION,
  getAddress,
  ParsingError,
  InsufficientBalanceError,
  CHAINS,
  filterTokensByDestinationChain,
  getReacheableChains,
} from "utils";
import { usePrevious } from "hooks";
import { useConnection } from "state/hooks";

export enum FormStatus {
  IDLE = "idle",
  TOUCHED = "touched",
  VALID = "valid",
  ERROR = "error",
}

type FormState = {
  status: FormStatus;
  token: string;
  amount: ethers.BigNumber;
  toChain: ChainId;
  fromChain: ChainId;
  toAddress?: string;
  error?: ParsingError;
};

const initialFormState: FormState = {
  status: FormStatus.IDLE,
  token: ethers.constants.AddressZero,
  amount: ethers.constants.Zero,
  toChain: DEFAULT_TO_CHAIN_ID,
  fromChain: DEFAULT_FROM_CHAIN_ID,
};

enum ActionType {
  SET_TOKEN = "SET_TOKEN",
  SET_AMOUNT = "SET_AMOUNT",
  SET_TO_CHAIN = "SET_TO_CHAIN",
  SET_FROM_CHAIN = "SET_FROM_CHAIN",
  SET_TO_ADDRESS = "SET_TO_ADDRESS",
  SET_ERROR = "SET_ERROR",
}
type Action =
  | {
      type: ActionType.SET_TOKEN;
      payload: string;
    }
  | {
      type: ActionType.SET_AMOUNT;
      payload: ethers.BigNumber;
    }
  | {
      type: ActionType.SET_TO_CHAIN;
      payload: ChainId;
    }
  | {
      type: ActionType.SET_FROM_CHAIN;
      payload: ChainId;
    }
  | {
      type: ActionType.SET_TO_ADDRESS;
      payload: string;
    }
  | {
      type: ActionType.SET_ERROR;
      payload: ParsingError | InsufficientBalanceError | undefined;
    };

function tokenReducer(state: FormState, token: string): FormState {
  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        token,
        amount: ethers.constants.Zero,
        error: undefined,
      };

    default:
      throw new Error("unreachable");
  }
}

function amountReducer(state: FormState, amount: ethers.BigNumber): FormState {
  const isLtZero = amount.lt(0);
  const isGtZero = amount.gt(0);
  const canTransitionToValid = !!state.toAddress && isGtZero;
  const error = isLtZero ? new ParsingError() : undefined;
  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.ERROR:
      return {
        ...state,
        amount,
        status: isLtZero
          ? FormStatus.ERROR
          : !canTransitionToValid
          ? FormStatus.TOUCHED
          : FormStatus.VALID,
        error,
      };
    case FormStatus.VALID:
      return {
        ...state,
        amount,
        status: isLtZero
          ? FormStatus.ERROR
          : isGtZero
          ? FormStatus.VALID
          : FormStatus.TOUCHED,
        error,
      };

    default:
      throw new Error("unreachable");
  }
}

function fromChainReducer(state: FormState, chainId: ChainId): FormState {
  let toChain = state.toChain;
  if (toChain === chainId) {
    toChain = getReacheableChains(chainId)[0];
  }
  const bridgeableTokens = filterTokensByDestinationChain(chainId, toChain);
  // Prefer the native currency if it exist and is shared (ex: ETH between rollups), otherwise take the first token available
  const token =
    bridgeableTokens.find(
      (t) => t.address === CHAINS[chainId].nativeCurrencyAddress
    )?.address ?? bridgeableTokens[0].address;

  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        fromChain: chainId,
        toChain,
        amount: ethers.constants.Zero,
        token,
        error: undefined,
      };
    default:
      throw new Error("unreachable");
  }
}

function toChainReducer(state: FormState, chainId: ChainId): FormState {
  let fromChain = state.fromChain;
  const bridgeableTokens = filterTokensByDestinationChain(fromChain, chainId);
  // Prefer the native currency if it exist and is shared (ex: ETH between rollups), otherwise take the first token available
  const token =
    bridgeableTokens.find(
      (t) => t.address === CHAINS[fromChain].nativeCurrencyAddress
    )?.address ?? bridgeableTokens[0].address;

  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return {
        ...state,
        status: FormStatus.IDLE,
        toChain: chainId,
        fromChain,
        amount: ethers.constants.Zero,
        token,
        error: undefined,
      };
    default:
      throw new Error("unreachable");
  }
}

function toAddressReducer(state: FormState, address: string): FormState {
  const isAmountGtZero = state.amount.gt(0);
  switch (state.status) {
    case FormStatus.IDLE: {
      return {
        ...state,
        status: FormStatus.TOUCHED,
        toAddress: address,
      };
    }
    case FormStatus.TOUCHED:
      return {
        ...state,
        status: isAmountGtZero ? FormStatus.VALID : FormStatus.TOUCHED,
        toAddress: address,
      };
    case FormStatus.VALID:
    case FormStatus.ERROR:
      return { ...state, toAddress: address };
    default:
      throw new Error("unreachable");
  }
}

function errorReducer(
  state: FormState,
  error: ParsingError | undefined
): FormState {
  switch (state.status) {
    case FormStatus.IDLE:
    case FormStatus.TOUCHED:
    case FormStatus.VALID:
      return { ...state, status: FormStatus.ERROR, error };
    case FormStatus.ERROR:
      return state;
    default:
      throw new Error("unreachable");
  }
}

function formReducer(state: FormState, action: Action) {
  switch (action.type) {
    case ActionType.SET_TOKEN:
      return tokenReducer(state, action.payload);
    case ActionType.SET_AMOUNT:
      return amountReducer(state, action.payload);
    case ActionType.SET_TO_CHAIN:
      return toChainReducer(state, action.payload);
    case ActionType.SET_FROM_CHAIN:
      return fromChainReducer(state, action.payload);
    case ActionType.SET_TO_ADDRESS:
      return toAddressReducer(state, action.payload);
    case ActionType.SET_ERROR:
      return errorReducer(state, action.payload);

    default: {
      throw new Error(`Unhandled action type`);
    }
  }
}

type SendFormManagerContext = FormState & {
  setFromChain: (fromChain: ChainId) => void;
  setToChain: (toChain: ChainId) => void;
  setToken: (token: string) => void;
  setAmount: (amount: ethers.BigNumber) => void;
  setToAddress: (toAddress: string) => void;
  setError: (error: ParsingError | undefined) => void;
};

function useSendFormManager(): SendFormManagerContext {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { account: connectedAccount, chainId } = useConnection();

  // Keep the connected account and the toAddress in sync. If a user switches account, the toAddress should be updated to this new account.
  useEffect(() => {
    if (connectedAccount) {
      dispatch({
        type: ActionType.SET_TO_ADDRESS,
        payload: getAddress(connectedAccount),
      });
    }
  }, [connectedAccount]);
  /*
	  The following block will change `fromChain` and `toChain` when the user first connects to the app.
    If connected to an unsupported chain, `fromChain` and `toChain` won't be set.
	*/
  const previousChainId = usePrevious(chainId);
  useEffect(() => {
    // The user has just connected to the app.
    if (chainId && previousChainId === undefined) {
      const connectedChainId = CHAINS_SELECTION.find((x) => x === chainId);
      if (connectedChainId) {
        dispatch({
          type: ActionType.SET_FROM_CHAIN,
          payload: connectedChainId,
        });
      }
    }
  }, [chainId, previousChainId]);

  const setToken = useCallback((token: string) => {
    dispatch({
      type: ActionType.SET_TOKEN,
      payload: token,
    });
  }, []);
  const setAmount = useCallback((amount: ethers.BigNumber) => {
    dispatch({
      type: ActionType.SET_AMOUNT,
      payload: amount,
    });
  }, []);
  const setToChain = useCallback((toChain: ChainId) => {
    dispatch({
      type: ActionType.SET_TO_CHAIN,
      payload: toChain,
    });
  }, []);
  const setFromChain = useCallback((fromChain: ChainId) => {
    dispatch({
      type: ActionType.SET_FROM_CHAIN,
      payload: fromChain,
    });
  }, []);
  const setToAddress = useCallback((toAddress: string) => {
    dispatch({
      type: ActionType.SET_TO_ADDRESS,
      payload: toAddress,
    });
  }, []);
  const setError = useCallback((error: ParsingError | undefined) => {
    dispatch({
      type: ActionType.SET_ERROR,
      payload: error,
    });
  }, []);

  return {
    ...state,
    setToken,
    setAmount,
    setToChain,
    setFromChain,
    setToAddress,
    setError,
  };
}
const SendFormContext = createContext<SendFormManagerContext | undefined>(
  undefined
);
SendFormContext.displayName = "SendFormContext";
/**
 * Context provider for the send form. This is used to share the state of the form between components.
 * @param props  React props, only accepting `children`
 */
export const SendFormProvider: React.FC = ({ children }) => {
  const state = useSendFormManager();

  return (
    <SendFormContext.Provider value={state}>
      {children}
    </SendFormContext.Provider>
  );
};
/**
 * This hook is used to manage the send form state. It returns the current state of the form, along with setters for the form.
 * @remarks This hook must be used within the {@link SendFormProvider} component.
 * @returns Returns a {@link SendFormManagerContext} object
 */
export function useSendForm() {
  const context = useContext(SendFormContext);
  if (!context) {
    throw new Error("UseSendForm must be used within a <SendFormProvider>");
  }
  return context;
}
