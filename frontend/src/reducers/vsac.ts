import { SET_VSAC_API_KEY } from '../actions/types';

export interface VSACState {
  apiKey: string | null;
}

interface SetVSACApiKeyAction {
  type: typeof SET_VSAC_API_KEY;
  apiKey: string;
}

type VSACAction = SetVSACApiKeyAction;

export const defaultState: VSACState = {
  apiKey: null
};

export default function vsac(state: VSACState = defaultState, action: VSACAction): VSACState {
  switch (action.type) {
    case SET_VSAC_API_KEY:
      return {
        ...state,
        apiKey: action.apiKey
      };
    default:
      return state;
  }
}
