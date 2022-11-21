import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import chainApi from "./chainApi";
import transactionsReducer from "./transactions";
import poolsReducer from "./pools";

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    pools: poolsReducer,
    [chainApi.reducerPath]: chainApi.reducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleWare) =>
    getDefaultMiddleWare({ serializableCheck: false }).concat(
      chainApi.middleware
    ),
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
