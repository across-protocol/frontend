import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { ChainId, UnsupportedChainIdError, isSupportedChainId } from "utils";

type State = {
  account?: string;
  chainId?: ChainId;
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  error?: Error;
};

export type Update = Omit<State, "error" | "chainId"> & { chainId?: number };
type ErrorUpdate = Required<Pick<State, "error">>;

function getAddress(address: string | undefined) {
  if (address === undefined) return;
  try {
    return ethers.utils.getAddress(address);
  } catch (err) {
    return address;
  }
}

const initialState: State = {};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    update: (state, action: PayloadAction<Update>) => {
      const { account, chainId, provider, signer } = action.payload;
      state.account = getAddress(account) ?? state.account;
      state.provider = provider ?? state.provider;
      // theres a potential problem with this: if onboard says a signer is undefined, we default them back
      // to the previous signer. This means we get out of sync with onboard and could have serious consequences.
      state.signer = signer ?? state.signer;
      if (chainId) {
        if (isSupportedChainId(chainId)) {
          state.chainId = chainId;
          if (state.error instanceof UnsupportedChainIdError) {
            state.error = undefined;
          }
        } else {
          state.error = new UnsupportedChainIdError(chainId);
        }
      }
      return state;
    },
    error: (state, action: PayloadAction<ErrorUpdate>) => {
      state.error = action.payload.error;
      return state;
    },
    disconnect: (state) => {
      state = initialState;
      return state;
    },
  },
});

const { actions, reducer } = connectionSlice;
// Extract and export each action creator by name
export const { update, disconnect, error } = actions;
// Export the reducer, either as a default or named export
export default reducer;
