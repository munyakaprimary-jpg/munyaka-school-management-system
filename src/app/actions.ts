import { AppDispatch } from '../store';

export const setStudentCount = (count: number) => async (dispatch: AppDispatch) => {
 dispatch({ type: 'setStudentCount', payload: count });
};