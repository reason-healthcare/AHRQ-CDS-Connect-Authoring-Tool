import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../reducers';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

// Typed version of useDispatch that knows about thunk actions
// The second type parameter is for extra argument (not used), so never is appropriate
export const useAppDispatch = (): ThunkDispatch<RootState, never, AnyAction> =>
  useDispatch<ThunkDispatch<RootState, never, AnyAction>>();

// Typed version of useSelector that knows about RootState
export function useAppSelector<TSelected>(
  selector: (state: RootState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected {
  return useSelector<RootState, TSelected>(selector, equalityFn);
}
