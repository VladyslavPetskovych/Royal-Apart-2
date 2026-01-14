import { configureStore } from "@reduxjs/toolkit";
import apartReducer from "./apartSlice";

export const store = configureStore({
  reducer: {
    apartStore: apartReducer,
  },
});
export default store;
