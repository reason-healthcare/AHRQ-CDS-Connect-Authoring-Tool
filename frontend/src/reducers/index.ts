import { combineReducers } from 'redux';
import type { Reducer, AnyAction } from 'redux';

import * as types from '../actions/types';
import artifactsReducer from './artifacts';
import authReducer from './auth';
import navigationReducer from './navigation';
import vsacReducer from './vsac';
import type { ArtifactState } from './artifacts';
import type { AuthState } from './auth';
import type { NavigationState } from './navigation';
import type { VSACState } from './vsac';

interface RootState {
  artifacts: ArtifactState;
  auth: AuthState;
  navigation: NavigationState;
  vsac: VSACState;
}

const appReducer = combineReducers({
  artifacts: artifactsReducer,
  auth: authReducer,
  navigation: navigationReducer,
  vsac: vsacReducer
});

const rootReducer: Reducer<RootState | undefined, AnyAction> = (
  state: RootState | undefined,
  action: AnyAction
): RootState => {
  let newState = state;
  if (action.type === types.LOGOUT_SUCCESS) {
    newState = undefined;
  }

  return appReducer(newState, action);
};

export default rootReducer;
