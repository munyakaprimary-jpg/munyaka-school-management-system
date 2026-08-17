import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Learner {
  id: string;
  name: string;
  email: string;
}

const initialState: Learner[] = [];

export const learnersSlice = createSlice({
  name: 'learners',
  initialState,
  reducers: {
    addLearner: (state, action: PayloadAction<Learner>) => {
      state.push(action.payload);
    },
  },
});

export const { addLearner } = learnersSlice.actions;

export default learnersSlice.reducer;