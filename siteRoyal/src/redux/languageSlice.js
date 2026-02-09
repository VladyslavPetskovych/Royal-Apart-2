import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "app_lang";

const initialState = {
  lang:
    (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "uk",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage(state, action) {
      state.lang = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setLanguage } = languageSlice.actions;

export const selectLanguage = (state) => state.language.lang;

export default languageSlice.reducer;
