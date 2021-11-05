import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import set from "lodash/set";
import { across } from "@uma/sdk";

interface State extends across.clients.bridgePool.State {
  error?: Error;
}

/*
  State object from SDK:
  pools,
  users,
  transactions
*/

const initialState: State = {
  pools: {},
  users: {},
  transactions: {},
  error: undefined,
};

const poolsSlice = createSlice({
  name: "pools",
  initialState,
  reducers: {
    update: (state, action: PayloadAction<{ path: string[]; data: any }>) => {
      const nextState = set(state, action.payload.path, action.payload.data);
      return nextState;
    },
    error: (state, action: PayloadAction<Pick<State, "error">>) => {
      state.error = action.payload.error;
      return state;
    },
  },
});

const { actions, reducer } = poolsSlice;
// Extract and export each action creator by name
export const { update, error } = actions;
// Export the reducer, either as a default or named export
export default reducer;
