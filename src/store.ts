import { configureStore, createSlice } from "@reduxjs/toolkit";
import learnersReducer from "./features/learners/learnersSlice";

const store = configureStore({
  reducer: {
    learners: learnersReducer,
    // Add other reducers here
  },
});

export default store;