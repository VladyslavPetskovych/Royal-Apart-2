import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchApartments = createAsyncThunk(
  "apartStore/fetchApartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        "https://royalapart.online/api/siteRoyal/get-all-wodoo"
      );
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || "Fetch failed"
      );
    }
  }
);

const apartSlice = createSlice({
  name: "apartStore",
  initialState: {
    apartments: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    setApartments(state, action) {
      state.apartments = action.payload || [];
    },
    clearApartments(state) {
      state.apartments = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApartments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchApartments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.apartments = action.payload;
      })
      .addCase(fetchApartments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Fetch failed";
      });
  },
});

export const { setApartments, clearApartments } = apartSlice.actions;

// selectors
export const selectApartments = (state) => state.apartStore.apartments;
export const selectApartStatus = (state) => state.apartStore.status;
export const selectApartError = (state) => state.apartStore.error;

export default apartSlice.reducer;
