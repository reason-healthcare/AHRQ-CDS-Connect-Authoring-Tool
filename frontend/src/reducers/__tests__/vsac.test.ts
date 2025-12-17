import * as types from 'actions/types';
import reducer, { type VSACState } from '../vsac';

interface SetVSACApiKeyAction {
  type: typeof types.SET_VSAC_API_KEY;
  apiKey: string;
}

describe('vsac reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {} as SetVSACApiKeyAction)).toEqual({
      apiKey: null
    });
  });

  it('should handle setting the vsac api key', () => {
    const action: SetVSACApiKeyAction = { type: types.SET_VSAC_API_KEY, apiKey: 'key' };
    const newState: VSACState = { apiKey: 'key' };
    expect(reducer([], action)).toEqual(newState);
  });
});
