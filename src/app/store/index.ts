import { configureStore } from "@reduxjs/toolkit";
import { shipsApi } from "../../shared/api/product/shipsApi";
export const createAppStore = () =>
  configureStore({
    reducer: { [shipsApi.reducerPath]: shipsApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(shipsApi.middleware),
  });
export const store = createAppStore();
