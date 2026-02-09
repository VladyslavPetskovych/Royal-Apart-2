import { configureStore } from "@reduxjs/toolkit";
import apartReducer from "./apartSlice";
import languageReducer from "./languageSlice";

export const store = configureStore({
  reducer: {
    apartStore: apartReducer,
    language: languageReducer,
  },
});

export default store;
