import { configureStore } from '@reduxjs/toolkit';
import { createReducer, PayloadAction } from '@reduxjs/toolkit';

interface StudentCountState {
 count: number;
}

const initialState: StudentCountState = {
 count: 0
};

const studentCountReducer = createReducer(initialState, {
 setStudentCount: (state, action: PayloadAction<number>) => {
 state.count = action.payload;
 }
});

const store = configureStore({
 reducer: {
 studentCount: studentCountReducer
 }
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;