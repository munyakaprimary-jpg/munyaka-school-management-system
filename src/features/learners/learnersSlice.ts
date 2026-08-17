import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  learners: [],
  loading: false,
  error: null,
};

const learnersSlice = createSlice({
  name: "learners",
  initialState,
  reducers: {
    fetchLearnersRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLearnersSuccess: (state, action) => {
      state.loading = false;
      state.learners = action.payload;
    },
    fetchLearnersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase("anotherAction", (state, action) => {
      // Handle another action
    });
  },
});

export const { fetchLearnersRequest, fetchLearnersSuccess, fetchLearnersFailure } =
  learnersSlice.actions;

export default learnersSlice.reducer;